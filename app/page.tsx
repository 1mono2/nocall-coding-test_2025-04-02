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
          <h1 className="text-2xl font-bold dark:text-white">顧客一覧</h1>
          <p className="text-gray-500 dark:text-gray-400">登録されているすべての顧客を表示します</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>顧客を追加</Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">新規顧客を追加</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                新しい顧客の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium dark:text-gray-300">
                  顧客名 *
                </label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="顧客名を入力"
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  キャンセル
                </Button>
                <Button type="submit">登録する</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 dark:text-white">読み込み中...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-lg p-6">
          顧客データがありません。「顧客を追加」ボタンから新しい顧客を登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">顧客名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">電話番号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">カスタム変数</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{customer.phoneNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
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
                          className="h-8 w-8 dark:text-gray-300 hover:bg-gray-800/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteCustomer(customer.customerId)}
                          title="顧客を削除"
                          className="h-8 w-8 bg-transparent  hover:bg-red-600/30"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
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
