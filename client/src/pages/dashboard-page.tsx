import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Package, AlertTriangle, Calendar, Store, Boxes } from "lucide-react";
import { productService, stockService } from "@/lib/api";
import { Product, StockItem } from "@/lib/types";

export default function DashboardPage() {
  const { username, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch products
        const productsData = await productService.getProducts();
        setProducts(productsData);
        
        // Fetch stock items
        const stockData = await stockService.getStock();
        setStockItems(stockData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Calculate dashboard metrics
  const totalProducts = products.length;
  const lowStockItems = stockItems.filter(item => item.quantity < 15).length;
  const expiringItems = stockItems.filter(item => item.days_remaining < 10).length;
  const totalStockItems = stockItems.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold">
              Bem-vindo(a) de volta, {username}
            </h3>
            <p className="text-muted-foreground mt-1">
              Você está logado como <span className="capitalize">{role}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Products */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium uppercase text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-semibold">{isLoading ? "-" : totalProducts}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Low Stock Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium uppercase text-muted-foreground">Itens em Baixo Estoque</p>
                  <p className="text-2xl font-semibold">{isLoading ? "-" : lowStockItems}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Expiring Soon */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium uppercase text-muted-foreground">Próximos a Vencer</p>
                  <p className="text-2xl font-semibold">{isLoading ? "-" : expiringItems}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                  <Calendar className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Stores or Stock Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium uppercase text-muted-foreground">
                    {role === "admin" ? "Total de Lojas" : "Total de Itens em Estoque"}
                  </p>
                  <p className="text-2xl font-semibold">{isLoading ? "-" : (role === "admin" ? "5" : totalStockItems)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  {role === "admin" ? (
                    <Store className="h-5 w-5 text-green-500" />
                  ) : (
                    <Boxes className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left text-xs font-medium uppercase tracking-wider">Atividade</th>
                    <th className="py-3 text-left text-xs font-medium uppercase tracking-wider">Usuário</th>
                    <th className="py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4 whitespace-nowrap text-sm">Adicionado 50 unidades de Leite Integral</td>
                    <td className="py-4 whitespace-nowrap text-sm">leader_novo</td>
                    <td className="py-4 whitespace-nowrap text-sm">1 hora atrás</td>
                  </tr>
                  <tr>
                    <td className="py-4 whitespace-nowrap text-sm">Criado novo produto: Leite Integral</td>
                    <td className="py-4 whitespace-nowrap text-sm">admin</td>
                    <td className="py-4 whitespace-nowrap text-sm">2 horas atrás</td>
                  </tr>
                  <tr>
                    <td className="py-4 whitespace-nowrap text-sm">Criada nova loja: Loja Nova</td>
                    <td className="py-4 whitespace-nowrap text-sm">admin</td>
                    <td className="py-4 whitespace-nowrap text-sm">1 dia atrás</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
