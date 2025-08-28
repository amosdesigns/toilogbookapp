import React from "react";
//import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SITE } from "@/StaticData/data";

// Define the form schema
const dutySchema = z.object({
  marina: z.string().min(1, "Please select a marina"),
  first_aid: z.boolean().default(false),
  fire_extinguisher: z.boolean().default(false),
  ring_buoy: z.boolean().default(false),
  throw_rope: z.boolean().default(false),
  life_jacket: z.boolean().default(false),
  radio: z.boolean().default(false),
});

type DutyFormData = z.infer<typeof dutySchema>;

interface DutyFormProps {
  duty?: boolean;
}

const DutyForm: React.FC<DutyFormProps> = ({ duty }) => {
  const form = useForm<DutyFormData>({
    resolver: zodResolver(dutySchema),
    defaultValues: {
      marina: "",
      first_aid: false,
      fire_extinguisher: false,
      ring_buoy: false,
      throw_rope: false,
      life_jacket: false,
      radio: false,
    },
  });

  const { register, handleSubmit } = useForm();
  const onSubmit: SubmitHandler = (data) => console.log(data);

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex justify-between flex-col">
            <FormField
              control={form.control}
              name="marina"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marina</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="select a marina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>select marina</SelectLabel>
                          {SITE.MARINA.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Select the marina for your duty assignment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col justify-end mt-4 gap-4">
              <Label>Please confirm the below list.*</Label>

              <FormField
                control={form.control}
                name="first_aid"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="first_aid"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="first_aid">First Aid Kit</Label>
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="fire_extinguisher"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="fire_extinguisher"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="fire_extinguisher">
                        Fire Extinguisher
                      </Label>
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="ring_buoy"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="ring_buoy"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="ring_buoy">24" USCG Ring Buoy</Label>
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="throw_rope"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="throw_rope"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="throw_rope">
                        49' Ring Buoy Throw Rope
                      </Label>
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="life_jacket"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="life_jacket"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="life_jacket">Life Jacket</Label>
                    </div>
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="radio"
                render={({ field }) => (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="radio"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="radio">Radio</Label>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!form.formState.isValid}
          >
            {!duty ? "On Duty" : "Off Duty"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default DutyForm;
