import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { productService } from "@/lib/api";
import { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productSchema = z.object({
  name: z.string().min(2, "Nome do produto deve ter pelo menos 2 caracteres"),
  ean: z.string().min(8, "EAN deve ter pelo menos 8 caracteres"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      ean: "",
    },
  });

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Falha ao carregar produtos",
        description: "Ocorreu um erro ao carregar os produtos. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.ean.includes(searchQuery)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsCreating(true);
    try {
      await productService.createProduct(data.name, data.ean);
      toast({
        title: "Produto criado",
        description: `${data.name} foi adicionado com sucesso.`,
      });
      fetchProducts(); // Refresh products list
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Falha ao criar produto",
        description: "Ocorreu um erro ao adicionar o produto. Por favor, tente novamente.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Gerenciamento de Produtos" 
        description="Visualize e gerencie seu inventário de produtos"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>
                Digite os detalhes do produto para adicioná-lo ao seu inventário.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome do produto" 
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
                  name="ean"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EAN</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o código EAN" 
                          {...field} 
                          disabled={isCreating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Produto"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or EAN..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">EAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{product.product_id}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{product.ean}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{product.category || "—"}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products found. Try a different search or add a new product.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
