
import { Button, Checkbox, Label, TextInput } from "flowbite-react";

export function LoginForm() {
  return (
    <div className="w-3/5 flex flex-col justify-start items-center mt-6 pt-6 bg-white rounded-2xl shadow-2xl h-2/5">
      <h1 className="text-4xl font-bold text-sky-950 align-text-top mt-6 mb-3">Sign In</h1>
      <h2>Please login with your email and password</h2>
      <form className="flex w-3/5 flex-col gap-4 mt-8">
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
