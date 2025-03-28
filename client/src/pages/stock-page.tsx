import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { productService, stockService } from "@/lib/api";
import { Product, StockFilterData, StockItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Esquema para adicionar ao estoque
const addStockSchema = z.object({
  product_id: z.string().min(1, "Por favor, selecione um produto"),
  expiration_date: z.string().min(1, "Por favor, selecione uma data de validade"),
  quantity: z
    .string()
    .min(1, "A quantidade é obrigatória")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "A quantidade deve ser um número maior que 0"),
  store_id: z.string().optional(),
});

// Esquema para filtrar o estoque
const filterStockSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_quantity: z.string().optional(),
  max_quantity: z.string().optional(),
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

  // Formulário para adicionar ao estoque
  const addStockForm = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      product_id: "",
      expiration_date: "",
      quantity: "",
      store_id: "",
    },
  });

  // Formulário para filtrar o estoque
  const filterStockForm = useForm<FilterStockFormValues>({
    resolver: zodResolver(filterStockSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      min_quantity: "",
      max_quantity: "",
    },
  });

  // Buscar produtos ao montar o componente
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await productService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({
          variant: "destructive",
          title: "Falha ao carregar produtos",
          description: "Houve um erro ao carregar os produtos. Tente novamente.",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [toast]);

  // Buscar itens do estoque
  const fetchStock = async (filters?: StockFilterData) => {
    setIsLoadingStock(true);
    try {
      const data = await stockService.getStock(filters);
      setStockItems(data);
    } catch (error) {
      console.error("Erro ao buscar itens do estoque:", error);
      toast({
        variant: "destructive",
        title: "Falha ao carregar itens do estoque",
        description: "Houve um erro ao carregar os itens do estoque. Tente novamente.",
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Adicionar ao estoque
  const onAddStock = async (data: AddStockFormValues) => {
    setIsAddingStock(true);
    try {
      const productId = Number(data.product_id);
      const quantity = Number(data.quantity);
      const storeId = data.store_id ? Number(data.store_id) : undefined;

      await stockService.addStock(productId, data.expiration_date, quantity, storeId);

      toast({
        title: "Estoque atualizado",
        description: "O estoque foi atualizado com sucesso.",
      });

      // Reset com valores como strings
      addStockForm.reset({
        product_id: "",
        expiration_date: "",
        quantity: "",
        store_id: "",
      });

      fetchStock();
    } catch (error) {
      console.error("Erro ao adicionar ao estoque:", error);
      toast({
        variant: "destructive",
        title: "Falha ao atualizar estoque",
        description: "Houve um erro ao atualizar o estoque. Tente novamente.",
      });
    } finally {
      setIsAddingStock(false);
    }
  };

  // Filtrar estoque
  const onFilterStock = async (data: FilterStockFormValues) => {
    try {
      const filters: StockFilterData = {
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        min_quantity: data.min_quantity ? Number(data.min_quantity) : undefined,
        max_quantity: data.max_quantity ? Number(data.max_quantity) : undefined,
      };

      fetchStock(filters);

      toast({
        title: "Filtros aplicados",
        description: "A lista de estoque foi filtrada conforme seus critérios.",
      });
    } catch (error) {
      console.error("Erro ao filtrar estoque:", error);
      toast({
        variant: "destructive",
        title: "Falha ao aplicar filtros",
        description: "Houve um erro ao aplicar os filtros. Tente novamente.",
      });
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Definir cor do badge de dias restantes
  const getDaysRemainingBadgeColor = (days: number) => {
    if (days <= 5) return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-800";
    if (days <= 15) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-800";
    return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-800";
  };

  // Função para renderizar o conteúdo da lista de estoque
  const renderStockContent = () => {
    if (isLoadingStock) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (stockItems.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum item em estoque encontrado. Tente aplicar filtros diferentes ou adicionar novos itens.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">EAN</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Validade</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Dias Restantes</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantidade</th>
              {role === "admin" && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Loja</th>
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
                  <Badge variant="outline" className={getDaysRemainingBadgeColor(item.days_remaining)}>
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
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Gerenciamento de Estoque"
        description="Gerencie e monitore os níveis de estoque do seu inventário"
      />

      {/* Seção de Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtrar Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...filterStockForm}>
            <form
              onSubmit={filterStockForm.handleSubmit(onFilterStock)}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <FormField
                control={filterStockForm.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="Quantidade mínima" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={filterStockForm.control}
                name="max_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Máxima</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="Quantidade máxima" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="md:col-span-4 flex justify-end">
                <Button type="submit">Aplicar Filtros</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de Adição ao Estoque */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Adicionar ao Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...addStockForm}>
                <form onSubmit={addStockForm.handleSubmit(onAddStock)} className="space-y-4">
                  <FormField
                    control={addStockForm.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoadingProducts || isAddingStock}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingProducts ? (
                              <SelectItem value="loading" disabled>
                                Carregando produtos...
                              </SelectItem>
                            ) : (
                              products.map((product) => (
                                <SelectItem
                                  key={product.product_id}
                                  value={product.product_id.toString()}
                                >
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
                        <FormLabel>Data de Validade</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isAddingStock} />
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
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Digite a quantidade"
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
                          <FormLabel>Loja</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isAddingStock}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma loja" />
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
                  <Button type="submit" className="w-full" disabled={isAddingStock}>
                    {isAddingStock && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isAddingStock ? "Adicionando..." : "Adicionar ao Estoque"}
                  </Button>

                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Estoque */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Estoque Atual {role === "admin" ? "(Todas as Lojas)" : "(Sua Loja)"}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderStockContent()}</CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}