'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hc } from 'hono/client';
import { AppType } from '@/app/api/v1/routes';
import { Trash, Pencil } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">顧客一覧</h1>
          <p className="text-muted-foreground">登録されているすべての顧客を表示します</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>顧客を追加</Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">新規顧客を追加</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                新しい顧客の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  顧客名 *
                </label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="顧客名を入力"
                  className="bg-background border-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium dark:text-gray-300">
                  電話番号
                </label>
                <Input
                  id="phone"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                  placeholder="電話番号を入力"
                  className="bg-background border-input"
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
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-foreground">読み込み中...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg p-6">
          顧客データがありません。「顧客を追加」ボタンから新しい顧客を登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">顧客名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">電話番号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">カスタム変数</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{customer.phoneNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      {customer.variables && Object.keys(customer.variables).length > 0
                        ? Object.keys(customer.variables).length + '個の変数'
                        : '変数なし'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/customers/${customer.customerId}`)}
                          title="詳細を表示"
                          className="h-8 w-8 hover:bg-muted-foreground/20 dark:hover:bg-muted-foreground/20"
                        >
                          <Pencil className="h-4 w-4 text-foreground/80" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteCustomer(customer.customerId)}
                          title="顧客を削除"
                          className="h-8 w-8 bg-transparent hover:bg-destructive/20 dark:hover:bg-destructive/20"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
