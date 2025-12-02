"""
Repopulate mindmesh_edges_global with correctly parsed prerequisite edges.

Logic:
- Solid lines (logic_type='and', group_id=null): Required prerequisites in AND relationships
- Dashed lines (logic_type='or', group_id='COURSE_g1'): Alternative prerequisites - same group_id = same color

Examples:
- "A AND B" → A solid, B solid
- "A OR B OR C" → A, B, C all dashed with SAME group_id (same color)
- "A AND (B OR C)" → A solid, B&C dashed with same group_id (same color)
- "(A OR B) AND (C OR D)" → A&B dashed (g1, blue), C&D dashed (g2, purple)
"""

import re
import os
import sys
from supabase import create_client, Client
from typing import List, Tuple, Dict, Set
import json

# Import config to load environment variables
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import SUPABASE_URL, SUPABASE_ROLE_KEY

# Initialize Supabase with service role key (needed for deleting)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ROLE_KEY)

# Course code pattern
COURSE_PATTERN = re.compile(r'\b([A-Z]{4}\d{4})\b')


def extract_course_codes(text: str) -> List[str]:
    """Extract all course codes from a string."""
    if not text:
        return []
    return COURSE_PATTERN.findall(text)


def normalize_prereq_string(prereq: str) -> str:
    """
    Normalize prerequisite string for parsing.
    - Convert 'Corequisite:' to AND with prerequisites
    - Remove 'Prerequisite:', 'Prerequisites:', etc.
    - Remove extra whitespace
    - Standardize AND/OR to uppercase
    - Remove non-course conditions
    """
    if not prereq:
        return ""
    
    # Handle Corequisites: convert "Prerequisite: A; Corequisite: B" to "A AND B"
    # Split by semicolon to separate prerequisite and corequisite sections
    parts = re.split(r';\s*', prereq)
    
    prereq_part = ""
    coreq_part = ""
    
    for part in parts:
        part = part.strip()
        if re.match(r'^(Prerequisite|Prerequisites|Prerequsite)s?\s*:', part, flags=re.IGNORECASE):
            prereq_part = re.sub(r'^(Prerequisite|Prerequisites|Prerequsite)s?\s*:\s*', '', part, flags=re.IGNORECASE)
        elif re.match(r'^Corequisite', part, flags=re.IGNORECASE):
            coreq_part = re.sub(r'^Corequisite\s*:\s*', '', part, flags=re.IGNORECASE)
    
    # Combine with AND if both exist
    if prereq_part and coreq_part:
        text = f"({prereq_part}) AND ({coreq_part})"
    elif prereq_part:
        text = prereq_part
    elif coreq_part:
        text = coreq_part
    else:
        # Remove prerequisite prefix if no semicolon structure
        text = re.sub(r'^(Prerequisite|Prerequisites|Prerequsite)s?\s*:\s*', '', prereq, flags=re.IGNORECASE)
    
    # Remove UOC requirements and other non-course conditions
    text = re.sub(r'\b(completed?|completion of)\s+\d+\s*UOC\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\benrolled? in\s+[^,)]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bfinal year of program\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(Pre-requisite[^)]*\)', '', text, flags=re.IGNORECASE)
    
    # Standardize boolean operators
    text = re.sub(r'\bAND\b', 'AND', text, flags=re.IGNORECASE)
    text = re.sub(r'\bOR\b', 'OR', text, flags=re.IGNORECASE)
    
    # Clean up whitespace and extra commas
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r',\s*,', ',', text)
    text = re.sub(r',\s*(AND|OR)', r' \1', text)
    text = re.sub(r'(AND|OR)\s*,', r'\1', text)
    
    return text.strip()


class PrereqParser:
    """Parse prerequisite strings into structured edge data."""
    
    def __init__(self, course_code: str, prereq_string: str):
        self.course_code = course_code
        self.prereq_string = normalize_prereq_string(prereq_string)
        self.edges = []
        self.group_counter = 0
    
    def parse(self) -> List[Dict]:
        """Parse the prerequisite string and return edge data."""
        if not self.prereq_string:
            return []
        
        # Extract all course codes first
        all_courses = extract_course_codes(self.prereq_string)
        if not all_courses:
            return []
        
        # Parse the structure
        try:
            self._parse_expression(self.prereq_string, all_courses)
        except Exception as e:
            print(f"⚠️  Error parsing {self.course_code}: {e}")
            # Fallback: create simple edges for all found courses
            for course in all_courses:
                self.edges.append({
                    'from_key': course,
                    'to_key': self.course_code,
                    'logic_type': 'and',
                    'group_id': None
                })
        
        return self.edges
    
    def _parse_expression(self, expr: str, courses: List[str]):
        """Parse a prerequisite expression recursively."""
        expr = expr.strip()
        
        # Check if entire expression is wrapped in parentheses
        if expr.startswith('(') and expr.endswith(')'):
            # Check if it's a FULL wrap (depth never hits 0 until the end)
            depth = 0
            is_full_wrap = True
            for i, char in enumerate(expr):
                if char == '(':
                    depth += 1
                elif char == ')':
                    depth -= 1
                    # If depth hits 0 before the last char, it's NOT a full wrap
                    if depth == 0 and i < len(expr) - 1:
                        is_full_wrap = False
                        break
            
            if is_full_wrap:
                # Entire expression is wrapped, unwrap it
                return self._parse_expression(expr[1:-1], courses)
        
        # Check for top-level AND
        and_parts = self._split_by_operator(expr, 'AND')
        if len(and_parts) > 1:
            # Multiple parts connected by AND
            for part in and_parts:
                self._parse_and_part(part, courses)
            return
        
        # Check for top-level OR
        or_parts = self._split_by_operator(expr, 'OR')
        if len(or_parts) > 1:
            # Simple OR - ALL courses get the SAME group_id (same color)
            group_id = self._next_group_id()
            for part in or_parts:
                part = part.strip()
                # Remove outer parentheses if present
                if part.startswith('(') and part.endswith(')'):
                    part = part[1:-1]
                
                part_courses = extract_course_codes(part)
                for course in part_courses:
                    if course in courses:
                        self.edges.append({
                            'from_key': course,
                            'to_key': self.course_code,
                            'logic_type': 'or',
                            'group_id': group_id  # SAME group_id for all OR parts!
                        })
            return
        
        # Single course or simple expression
        expr_courses = extract_course_codes(expr)
        for course in expr_courses:
            if course in courses:
                self.edges.append({
                    'from_key': course,
                    'to_key': self.course_code,
                    'logic_type': 'and',
                    'group_id': None
                })
    
    def _parse_and_part(self, part: str, courses: List[str]):
        """Parse a part of an AND expression."""
        part = part.strip()
        
        # Check if it's a parenthesized OR group
        if part.startswith('(') and part.endswith(')'):
            inner = part[1:-1]
            or_parts = self._split_by_operator(inner, 'OR')
            
            if len(or_parts) > 1:
                # It's an OR group - create dashed edges with same group
                group_id = self._next_group_id()
                for or_part in or_parts:
                    part_courses = extract_course_codes(or_part)
                    for course in part_courses:
                        if course in courses:
                            self.edges.append({
                                'from_key': course,
                                'to_key': self.course_code,
                                'logic_type': 'or',
                                'group_id': group_id
                            })
                return
        
        # Check for OR without parentheses
        or_parts = self._split_by_operator(part, 'OR')
        if len(or_parts) > 1:
            group_id = self._next_group_id()
            for or_part in or_parts:
                part_courses = extract_course_codes(or_part)
                for course in part_courses:
                    if course in courses:
                        self.edges.append({
                            'from_key': course,
                            'to_key': self.course_code,
                            'logic_type': 'or',
                            'group_id': group_id
                        })
            return
        
        # Single course or simple requirement
        part_courses = extract_course_codes(part)
        for course in part_courses:
            if course in courses:
                self.edges.append({
                    'from_key': course,
                    'to_key': self.course_code,
                    'logic_type': 'and',
                    'group_id': None
                })
    
    def _split_by_operator(self, expr: str, operator: str) -> List[str]:
        """Split expression by operator, respecting parentheses."""
        parts = []
        current = []
        depth = 0
        
        tokens = re.split(r'(\(|\)|AND|OR)', expr)
        i = 0
        while i < len(tokens):
            token = tokens[i].strip()
            
            if not token:
                i += 1
                continue
            
            if token == '(':
                depth += 1
                current.append(token)
            elif token == ')':
                depth -= 1
                current.append(token)
            elif token == operator and depth == 0:
                # Found operator at top level
                if current:
                    parts.append(' '.join(current).strip())  # Use space to join!
                    current = []
            else:
                current.append(token)
            
            i += 1
        
        if current:
            parts.append(' '.join(current).strip())  # Use space to join!
        
        return [p for p in parts if p]
    
    def _next_group_id(self) -> str:
        """Generate next group ID."""
        self.group_counter += 1
        return f"{self.course_code}_g{self.group_counter}"


def fetch_all_courses_with_prereqs():
    """Fetch all courses that have prerequisites."""
    print("📚 Fetching courses with prerequisites...")
    
    response = supabase.table("unsw_courses").select(
        "code, conditions_for_enrolment"
    ).not_.is_("conditions_for_enrolment", "null").execute()
    
    courses = response.data
    # Filter out empty strings
    courses = [c for c in courses if c.get('conditions_for_enrolment', '').strip()]
    
    print(f"✅ Found {len(courses)} courses with prerequisites")
    return courses


def parse_all_prerequisites(courses: List[Dict]) -> List[Dict]:
    """Parse all prerequisite strings into edge data."""
    print("\n🔍 Parsing prerequisites...")
    all_edges = []
    
    for i, course in enumerate(courses):
        code = course['code']
        prereq = course['conditions_for_enrolment']
        
        parser = PrereqParser(code, prereq)
        edges = parser.parse()
        
        if edges:
            all_edges.extend(edges)
            if (i + 1) % 100 == 0:
                print(f"   Processed {i + 1}/{len(courses)} courses...")
    
    print(f"✅ Parsed {len(all_edges)} edges from {len(courses)} courses")
    return all_edges


def deduplicate_edges(edges: List[Dict]) -> List[Dict]:
    """Remove duplicate edges and self-references."""
    seen = {}
    unique_edges = []
    
    for edge in edges:
        # Skip self-referencing edges
        if edge['from_key'] == edge['to_key']:
            continue
        
        # Use (from_key, to_key) as key - only keep first occurrence
        key = (edge['from_key'], edge['to_key'])
        if key not in seen:
            seen[key] = edge
            unique_edges.append(edge)
    
    print(f"✅ Deduplicated to {len(unique_edges)} unique edges")
    return unique_edges


def clear_existing_edges():
    """Delete all existing edges from mindmesh_edges_global."""
    print("\n🗑️  Clearing existing edges...")
    
    try:
        # Delete all rows
        response = supabase.table("mindmesh_edges_global").delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("✅ Cleared existing edges")
    except Exception as e:
        print(f"⚠️  Error clearing edges: {e}")
        print("   Continuing anyway...")


def insert_edges_batch(edges: List[Dict], batch_size: int = 500):
    """Insert edges in batches."""
    print(f"\n📥 Inserting {len(edges)} edges in batches of {batch_size}...")
    
    total_inserted = 0
    
    for i in range(0, len(edges), batch_size):
        batch = edges[i:i + batch_size]
        
        # Prepare batch data
        batch_data = []
        for edge in batch:
            batch_data.append({
                'from_key': edge['from_key'],
                'to_key': edge['to_key'],
                'edge_type': 'prereq',
                'logic_type': edge['logic_type'],
                'group_id': edge.get('group_id'),
                'confidence': '1.0',
                'rationale': 'automated_parser_v2',
                'metadata': {}
            })
        
        try:
            response = supabase.table("mindmesh_edges_global").insert(batch_data).execute()
            total_inserted += len(batch)
            print(f"   Inserted {total_inserted}/{len(edges)} edges...")
        except Exception as e:
            print(f"❌ Error inserting batch {i//batch_size + 1}: {e}")
            # Try inserting one by one for this batch
            for edge_data in batch_data:
                try:
                    supabase.table("mindmesh_edges_global").insert(edge_data).execute()
                    total_inserted += 1
                except Exception as e2:
                    print(f"   ⚠️  Failed to insert edge {edge_data['from_key']} -> {edge_data['to_key']}: {e2}")
    
    print(f"✅ Successfully inserted {total_inserted} edges")


def verify_sample_courses():
    """Verify parsing for sample courses."""
    print("\n🔬 Verifying sample courses...")
    
    sample_codes = ['COMP2511', 'AERO3410', 'CEIC2007', 'CEIC2000', 'COMP3151']
    
    for code in sample_codes:
        response = supabase.table("mindmesh_edges_global").select(
            "from_key, to_key, logic_type, group_id"
        ).eq("to_key", code).execute()
        
        edges = response.data
        print(f"\n   {code}:")
        for edge in edges:
            line_type = "solid" if edge['logic_type'] == 'and' else f"dashed ({edge['group_id']})"
            print(f"      {edge['from_key']} → {code} [{line_type}]")


def main():
    """Main execution function."""
    print("=" * 70)
    print("🚀 MindMesh Edge Repopulation Script")
    print("=" * 70)
    
    # Step 1: Fetch courses with prerequisites
    courses = fetch_all_courses_with_prereqs()
    
    # Step 2: Parse all prerequisites
    all_edges = parse_all_prerequisites(courses)
    
    # Step 3: Deduplicate
    unique_edges = deduplicate_edges(all_edges)
    
    # Step 4: Clear existing edges
    clear_existing_edges()
    
    # Step 5: Insert new edges
    insert_edges_batch(unique_edges)
    
    # Step 6: Verify sample courses
    verify_sample_courses()
    
    print("\n" + "=" * 70)
    print("✅ MindMesh edge repopulation complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()