
import { Button, Checkbox, Label, TextInput } from "flowbite-react";

export function LoginForm() {
  return (
    <div className="w-screen flex justify-center mt-6">
      <form className="flex w-1/5 flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="email1">Your email</Label>
          </div>
          <TextInput id="email1" type="email" placeholder="Email / Username" required />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1">Your password</Label>
          </div>
          <TextInput id="password1" type="password" required placeholder="Password"/>
        </div>
        <div className="flex items-center gap-2 max-w-sm">
          <Checkbox id="remember" />
          <Label htmlFor="remember">Remember me</Label>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
