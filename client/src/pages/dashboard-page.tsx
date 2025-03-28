import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Package, AlertTriangle, Calendar, Store, Boxes } from "lucide-react";
import { productService, stockService, activityService } from "@/lib/api";
import { Product, StockItem, Activity } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";



export default function DashboardPage() {
  const { username, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]); // Tipo explícito para activities
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [productsData, stockData, activitiesData] = await Promise.all([
          productService.getProducts(),
          stockService.getStock(),
          activityService.getActivities(), // Usa /api conforme api.ts
        ]);

        setProducts(productsData);
        setStockItems(stockData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        if (error instanceof Error && (error as any).response?.status === 401) {
          toast({
            variant: "destructive",
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
          });
        } else if (error instanceof Error) {
          toast({
            variant: "destructive",
            title: "Erro inesperado",
            description: `Erro: ${error.message}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Falha ao carregar dados",
            description: "Não foi possível carregar os dados do dashboard. Verifique sua conexão ou tente novamente.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const totalProducts = products.length;
  const lowStockItems = stockItems.filter(item => item.quantity < 15).length;
  const expiringItems = stockItems.filter(item => item.days_remaining < 10).length;
  const totalStockItems = stockItems.length;

  interface RelativeTimeProps {
    timestamp: string | number | Date;
  }

  const getRelativeTime = (timestamp: RelativeTimeProps["timestamp"]): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Há menos de 1 hora';
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  };
  const renderActivitiesContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
            Carregando atividades...
          </td>
        </tr>
      );
    }

    if (activities.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma atividade recente
          </td>
        </tr>
      );
    }
    return activities.map((activity, index) => (
      <tr key={index}>
        <td className="py-4 whitespace-nowrap text-sm">{activity.description}</td>
        <td className="py-4 whitespace-nowrap text-sm">{activity.username}</td>
        <td className="py-4 whitespace-nowrap text-sm">
          {getRelativeTime(activity.created_at)}
        </td>
      </tr>
    ));
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cartão de boas-vindas */}
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

          {/* Itens com pouca quantidade */}
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

          {/* Próximos a vencer */}
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

          {/* Total de Lojas ou Stock de Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium uppercase text-muted-foreground">
                    {role === "admin" ? "Total de Lojas" : "Total de Itens em Estoque"}
                  </p>
                  {(() => {
                    let displayValue;
                    if (isLoading) {
                      displayValue = "-";
                    } else if (role === "admin") {
                      displayValue = "5"; // Substitua por uma API real se necessário
                    } else {
                      displayValue = totalStockItems;
                    }
                    return <p className="text-2xl font-semibold">{displayValue}</p>;
                  })()}
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

        {/* Atividades Recentes */}
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
                  {renderActivitiesContent()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}