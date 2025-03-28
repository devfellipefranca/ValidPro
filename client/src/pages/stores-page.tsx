import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { adminService } from "@/lib/api";
import { Store } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const lojaSchema = z.object({
  nomeLoja: z.string().min(1, "O nome da loja deve ter pelo menos 2 caracteres"),
  usuarioLider: z.string().min(1, "O nome de usuário do líder deve ter pelo menos 3 caracteres"),
  senhaLider: z.string().min(1, "A senha do líder deve ter pelo menos 6 caracteres"),
});

type LojaFormValues = z.infer<typeof lojaSchema>;

export default function PaginaLojas() {
  const [estaCriando, setEstaCriando] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Configuração do formulário
  const form = useForm<LojaFormValues>({
    resolver: zodResolver(lojaSchema),
    defaultValues: {
      nomeLoja: "",
      usuarioLider: "",
      senhaLider: "",
    },
  });

  // Buscar lojas
  const fetchStores = async () => {
    try {
      const data = await adminService.getStores();
      console.log("Dados recebidos" , data);
      if(data && data.length > 0) {
        setStores(data);
      } else {
        setStores([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar lojas:", error);
      toast({
        variant: "destructive",
        title: "Falha ao buscar lojas",
        description: error.message || "Erro ao carregar lojas",
      });
    } finally{
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores()
  }, []);

  // Envio do formulário
  const onSubmit = async (data: LojaFormValues) => {
    setEstaCriando(true);
    try {
      await adminService.createStore(
        data.nomeLoja,
        data.usuarioLider,
        data.senhaLider
      );
      toast({
        title: "Loja criada",
        description: `${data.nomeLoja} e a conta do líder foram criadas com sucesso.`,
      });
      await fetchStores();
      form.reset();
    } catch (error) {
      console.error("Erro ao criar loja:", error);
      toast({
        variant: "destructive",
        title: "Falha ao criar loja",
        description: "Ocorreu um erro ao criar a loja. Por favor, tente novamente.",
      });
    } finally {
      setEstaCriando(false);
    }
  };

  // Função para renderizar o conteúdo das lojas
  const renderStoresContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    if (stores.length === 0) {
      return (
        <div className="text-center text-gray-500">
          Nenhuma loja encontrada
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nome da Loja</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Líder</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Criada</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stores.map((store) => (
              <tr key={store.store_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{store.store_id}</td>
                <td className="px-4 py-3">{store.name}</td>
                <td className="px-4 py-3">{store.leader}</td>
                <td className="px-4 py-3">{new Date(store.created_at).toLocaleDateString("pt-BR")}</td>
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
        title="Gerenciamento de Lojas"
        description="Crie e gerencie lojas e seus líderes"
      >
        <Button>Adicionar Nova Loja</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de Criação */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nomeLoja"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Loja</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome da loja"
                            {...field}
                            disabled={estaCriando}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usuarioLider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário do Líder</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o usuário do líder"
                            {...field}
                            disabled={estaCriando}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senhaLider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Líder</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Digite a senha do líder"
                            {...field}
                            disabled={estaCriando}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={estaCriando}
                  >
                    {estaCriando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Loja"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Lojas */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Lojas</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStoresContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
