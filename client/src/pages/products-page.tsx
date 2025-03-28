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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

// Schema
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

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", ean: "" },
    });

    // Buscar produtos
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await productService.getProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            toast({
                variant: "destructive",
                title: "Falha ao carregar produtos",
                description: "Ocorreu um erro ao carregar os produtos. Por favor, tente novamente.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query === "") return setFilteredProducts(products);
        setFilteredProducts(products.filter(p =>
            p.name.toLowerCase().includes(query) || p.ean.includes(query)
        ));
    }, [searchQuery, products]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);

    // Criar produto
    const onSubmit = async (data: ProductFormValues) => {
        setIsCreating(true);
        try {
            await productService.createProduct(data.name, data.ean);
            toast({ title: "Produto criado", description: `${data.name} foi adicionado com sucesso.` });
            fetchProducts();
            setDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Erro ao criar produto:", error);
            toast({
                variant: "destructive",
                title: "Falha ao criar produto",
                description: "Ocorreu um erro ao adicionar o produto. Por favor, tente novamente.",
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Upload de arquivo em base64
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = error => reject(error);
        });
    };

    const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const base64File = await convertFileToBase64(file);
            const response = await fetch("http://localhost:3000/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: base64File, filename: file.name }),
            });
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error("Erro ao enviar arquivo:", error);
        }
    };

    return (
        <DashboardLayout>
            <PageHeader title="Gerenciamento de Produtos" description="Visualize e gerencie seu inventário de produtos">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild><Button>Adicionar Novo Produto</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Produto</DialogTitle>
                            <DialogDescription>Digite os detalhes do produto para adicioná-lo ao seu inventário.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Produto</FormLabel>
                                        <FormControl><Input placeholder="Digite o nome do produto" {...field} disabled={isCreating} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="ean" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>EAN</FormLabel>
                                        <FormControl><Input placeholder="Digite o código EAN" {...field} disabled={isCreating} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <DialogFooter>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...</>) : "Adicionar Produto"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            {/* Barra de busca */}
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar produtos por nome ou EAN..." className="pl-10" value={searchQuery} onChange={handleSearch} />
                </div>

                {/* Upload Excel */}
                <div>
                    <Label>Importar Arquivo de Produtos</Label>
                    <Input type="file" accept=".xlsx" onChange={uploadFile} />
                </div>

                {/* Lista de produtos */}
                <Card>
                    <CardHeader><CardTitle>Produtos</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-8"><p className="text-muted-foreground">Nenhum produto encontrado. Tente uma busca diferente ou adicione um novo produto.</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nome</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">EAN</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoria</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Criado em</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredProducts.map(product => (
                                            <tr key={product.product_id}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">{product.product_id}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">{product.ean}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">{product.category ?? "—"}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(product.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
