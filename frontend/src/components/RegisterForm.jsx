import { Button, Checkbox, Label, Select, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";

function RegisterForm() {
    return (
    <form className="flex w-100 flex-col gap-4">
      <div>
        <div className="mb-2 block">
          <Label htmlFor='firstName'>First Name</Label>
        </div>
        <TextInput id="firstName" type="text" placeholder="Enter First Name" required shadow />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor='lastName'>Last Name</Label>
        </div>
        <TextInput id="lastName" type="text" placeholder="Enter Last Name" required shadow />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="email2">Your Email</Label>
        </div>
        <TextInput id="email2" type="email" placeholder="email@domain.com" required shadow />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor='dob'>Date of Birth</Label>
        </div>
        <TextInput id="dob" type="date" required shadow />
      </div>
      <div>
        <div>
          <Label className="mb-2 block" htmlFor="gender">Gender</Label>
        </div>
          <Select id="gender" name="gender">
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="password2">Your Password</Label>
        </div>
        <TextInput id="password2" type="password" required shadow />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="repeat-password">Confirm Password</Label>
        </div>
        <TextInput id="repeat-password" type="password" required shadow />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox 
        id="agree"
        />
        <Label htmlFor="agree" className="flex">
          I agree with the&nbsp;
          <Link href="#" className="text-blue-900 hover:underline dark:text-blue-600">
            terms and conditions
          </Link>
        </Label>
      </div>
      <div className="flex justify-center">
        <Link>
          <Button size="lg" pill type="submit">Register new account</Button>
        </Link>  
      </div>
    </form>
  );
}

export default RegisterForm