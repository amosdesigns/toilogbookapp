import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DutyForm from "./DutyForm";

const duty = true;
const form = { valid: false }; // Assuming form validation state
const profile = { firstName: "John", lastName: "Smith", title: "Marina Guard" }; // Example profile data

const OnOffDuty = () => {
  return (
    <Card className="w-full sm:flex max-w-lg">
      <CardHeader>
        <CardTitle className="text-3xl flex items-center">
          <Avatar className="w-20 h-20 sm:w-50 sm:h-50 mr-4">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-5xl sm:text-6xl">
              {!duty ? "On Duty" : "Off Duty"}
            </h1>
            <p className="text-xl font-bold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{profile.title}</p>
          </div>
        </CardTitle>
        <CardDescription>
          <p className="flex break-words text-sm text-muted-foreground justify-center">
            {!duty
              ? `${profile.firstName}, you are signing in for duty.`
              : `${profile.firstName}, you are signing out of duty. Thank you for your time!`}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DutyForm duty={duty} />
      </CardContent>
    </Card>
  );
};

export default OnOffDuty;
