from fastapi import Depends

class User:
    def __init__(self, id: str):
        self.id = id

def get_current_user():
    # Ex UID
    return User(id="546ecfc3-99f7-49c3-b890-afb5bc0d475a")
