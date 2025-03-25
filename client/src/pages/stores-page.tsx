import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { adminService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const storeSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  leaderUsername: z.string().min(3, "Leader username must be at least 3 characters"),
  leaderPassword: z.string().min(6, "Leader password must be at least 6 characters"),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function StoresPage() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "",
      leaderUsername: "",
      leaderPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: StoreFormValues) => {
    setIsCreating(true);
    try {
      await adminService.createStore(
        data.storeName,
        data.leaderUsername,
        data.leaderPassword
      );
      toast({
        title: "Store created",
        description: `${data.storeName} and leader account have been created successfully.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error creating store:", error);
      toast({
        variant: "destructive",
        title: "Failed to create store",
        description: "There was an error creating the store. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Stores Management"
        description="Create and manage store locations and leaders"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Store Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New Store</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter store name"
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
                    name="leaderUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leader Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter leader username"
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
                    name="leaderPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leader Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter leader password"
                            {...field}
                            disabled={isCreating}
                          />
                        </FormControl>
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
                      "Create Store"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Stores List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Store Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Leader</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">1</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">Loja Nova</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">leader_novo</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">1 day ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">2</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">Loja Central</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">leader_central</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">3 days ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">3</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">Loja Sul</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">leader_sul</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">1 week ago</td>
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
