import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { leaderService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["promoter", "repositor"], {
    required_error: "Please select a role",
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "promoter",
    },
  });

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsCreating(true);
    try {
      await leaderService.createUser(
        data.username,
        data.password,
        data.role
      );
      toast({
        title: "User created",
        description: `${data.username} has been created with role ${data.role}.`,
      });
      form.reset({
        username: "",
        password: "",
        role: "promoter",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: "There was an error creating the user. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Users Management"
        description="Create and manage store users"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter username"
                            {...field}
                            disabled={isCreating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter password"
                            {...field}
                            disabled={isCreating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isCreating}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="promoter">Promoter</SelectItem>
                            <SelectItem value="repositor">Repositor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Store Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">promoter_1</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-800">
                          Promoter
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">2 days ago</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-800">
                          Active
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">repositor_1</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-800">
                          Repositor
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">1 week ago</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-800">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
