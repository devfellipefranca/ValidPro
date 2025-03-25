import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { productService, stockService } from "@/lib/api";
import { Product, StockFilterData, StockItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Form schema for adding to stock
const addStockSchema = z.object({
  product_id: z.string().min(1, "Please select a product"),
  expiration_date: z.string().min(1, "Please select an expiration date"),
  quantity: z.string().transform((val) => Number(val)).refine((val) => val > 0, "Quantity must be greater than 0"),
  store_id: z.string().optional(),
});

// Form schema for filtering stock
const filterStockSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_quantity: z.string().transform((val) => val ? Number(val) : undefined).optional(),
  max_quantity: z.string().transform((val) => val ? Number(val) : undefined).optional(),
});

type AddStockFormValues = z.infer<typeof addStockSchema>;
type FilterStockFormValues = z.infer<typeof filterStockSchema>;

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const { toast } = useToast();
  const { role } = useAuth();

  // Add stock form
  const addStockForm = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      product_id: "",
      expiration_date: "",
      quantity: "",
      store_id: "",
    },
  });

  // Filter stock form
  const filterStockForm = useForm<FilterStockFormValues>({
    resolver: zodResolver(filterStockSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      min_quantity: "",
      max_quantity: "",
    },
  });

  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await productService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          variant: "destructive",
          title: "Failed to load products",
          description: "There was an error loading the products. Please try again.",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [toast]);

  // Fetch stock items on component mount
  const fetchStock = async (filters?: StockFilterData) => {
    setIsLoadingStock(true);
    try {
      const data = await stockService.getStock(filters);
      setStockItems(data);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      toast({
        variant: "destructive",
        title: "Failed to load stock items",
        description: "There was an error loading the stock items. Please try again.",
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [toast]);

  // Handle adding to stock
  const onAddStock = async (data: AddStockFormValues) => {
    setIsAddingStock(true);
    try {
      const productId = parseInt(data.product_id);
      const quantity = parseInt(data.quantity.toString());
      const storeId = data.store_id ? parseInt(data.store_id) : undefined;
      
      await stockService.addStock(
        productId,
        data.expiration_date,
        quantity,
        storeId
      );
      
      toast({
        title: "Stock updated",
        description: "The stock has been updated successfully.",
      });
      
      // Reset form
      addStockForm.reset({
        product_id: "",
        expiration_date: "",
        quantity: "",
        store_id: "",
      });
      
      // Refresh stock items
      fetchStock();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({
        variant: "destructive",
        title: "Failed to update stock",
        description: "There was an error updating the stock. Please try again.",
      });
    } finally {
      setIsAddingStock(false);
    }
  };

  // Handle filtering stock
  const onFilterStock = async (data: FilterStockFormValues) => {
    try {
      const filters: StockFilterData = {};
      if (data.start_date) filters.start_date = data.start_date;
      if (data.end_date) filters.end_date = data.end_date;
      if (data.min_quantity) filters.min_quantity = parseInt(data.min_quantity.toString());
      if (data.max_quantity) filters.max_quantity = parseInt(data.max_quantity.toString());
      
      fetchStock(filters);
      
      toast({
        title: "Filters applied",
        description: "Stock list has been filtered according to your criteria.",
      });
    } catch (error) {
      console.error("Error filtering stock:", error);
      toast({
        variant: "destructive",
        title: "Failed to apply filters",
        description: "There was an error applying filters. Please try again.",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get days remaining badge color
  const getDaysRemainingBadgeColor = (days: number) => {
    if (days <= 5) return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-800";
    if (days <= 15) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-800";
    return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-800";
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Stock Management"
        description="Manage and monitor your inventory stock levels"
      />

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...filterStockForm}>
            <form onSubmit={filterStockForm.handleSubmit(onFilterStock)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={filterStockForm.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min quantity"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="max_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max quantity"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="md:col-span-4 flex justify-end">
                <Button type="submit">
                  Apply Filters
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add to Stock Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add to Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...addStockForm}>
                <form onSubmit={addStockForm.handleSubmit(onAddStock)} className="space-y-4">
                  <FormField
                    control={addStockForm.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoadingProducts || isAddingStock}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingProducts ? (
                              <SelectItem value="" disabled>
                                Loading products...
                              </SelectItem>
                            ) : (
                              products.map((product) => (
                                <SelectItem key={product.product_id} value={product.product_id.toString()}>
                                  {product.name} ({product.ean})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addStockForm.control}
                    name="expiration_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isAddingStock}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addStockForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Enter quantity"
                            {...field}
                            disabled={isAddingStock}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {role === "admin" && (
                    <FormField
                      control={addStockForm.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isAddingStock}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a store" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Loja Nova</SelectItem>
                              <SelectItem value="2">Loja Central</SelectItem>
                              <SelectItem value="3">Loja Sul</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isAddingStock}
                  >
                    {isAddingStock ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add to Stock"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Stock List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Current Stock {role === "admin" ? "(All Stores)" : "(Your Store)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : stockItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">EAN</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Expiration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Days Left</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                        {role === "admin" && (
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Store</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stockItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">{item.ean}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(item.expiration_date)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <Badge
                              variant="outline"
                              className={getDaysRemainingBadgeColor(item.days_remaining)}
                            >
                              {item.days_remaining}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">{item.quantity}</td>
                          {role === "admin" && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm">{item.store_name || "—"}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No stock items found. Try applying different filters or add new items to stock.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
