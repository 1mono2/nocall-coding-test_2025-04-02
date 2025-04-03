'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hc } from 'hono/client';
import { AppType } from '@/app/api/v1/routes';
import { Trash, Pencil } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomerDTO } from './dto/types';

export default function Home() {
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phoneNumber: '',
  });
  const client = hc<AppType>('/').api.v1;
  const router = useRouter();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await client.customers.$get();
      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      console.error('顧客データの取得中にエラーが発生しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    try {
      const response = await client.customers.$post({
        json: {
          name: newCustomer.name,
          phoneNumber: newCustomer.phoneNumber
        }
      });

      await response.json();
      setDialogOpen(false);
      setNewCustomer({ name: '', phoneNumber: '' });
      fetchCustomers();
    } catch (error) {
      console.error('顧客作成中にエラーが発生しました:', error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('この顧客を削除してもよろしいですか？')) return;

    try {
      const response = await client.customers[':id'].$delete({ param: { id: customerId } });
      await response.json();
      fetchCustomers();
    } catch (error) {
      console.error('顧客削除中にエラーが発生しました:', error);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>顧客一覧</CardTitle>
            <CardDescription>登録されているすべての顧客を表示します</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>顧客を追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規顧客を追加</DialogTitle>
                <DialogDescription>
                  新しい顧客の情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    顧客名 *
                  </label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="顧客名を入力"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    電話番号 *
                  </label>
                  <Input
                    id="phone"
                    value={newCustomer.phoneNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                    placeholder="電話番号を入力"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">登録する</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">読み込み中...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              顧客データがありません。「顧客を追加」ボタンから新しい顧客を登録してください。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>カスタム変数</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      {customer.variables && Object.keys(customer.variables).length > 0
                        ? Object.keys(customer.variables).length + '個の変数'
                        : '変数なし'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          className="bg-transparent hover:bg-gray-200"
                          onClick={() => router.push(`/customers/${customer.customerId}`)}
                          title="詳細を表示"
                        >
                          <Pencil className="h-4 w-4 text-gray-900" />
                        </Button>
                        <Button
                          size="icon"
                          className="bg-transparent hover:bg-red-100"
                          onClick={() => handleDeleteCustomer(customer.customerId)}
                          title="顧客を削除"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
