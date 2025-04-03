'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AppType } from '@/app/api/v1/routes';
import { hc } from "hono/client";
import { CustomerDTO } from '@/app/dto/types';

// フロントエンド用のカスタム型
type CustomerDetailData = {
  customerId: string;
  name: string;
  phoneNumber?: string;
  // Record型として変数を管理（使いやすいように変換）
  variables: Record<string, string>;
};

type Call = {
  callId: string;
  customerId: string;
  status: 'queued' | 'in-progress' | 'completed' | 'canceled' | 'failed';
  requestedAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
};

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<CustomerDetailData>();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [customerForm, setCustomerForm] = useState<{
    name: string;
    phoneNumber?: string;
  }>({ name: '', phoneNumber: '' });
  const [variableDialog, setVariableDialog] = useState(false);
  const [newVariable, setNewVariable] = useState({ key: '', value: '' });
  const client = hc<AppType>('/').api.v1;
  
  // 顧客情報を取得
  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await client.customers[':id'].$get({ param: { id: customerId } });
      const data = await response.json();
      
      // APIから返されるDTOを変換
      // variables配列を使いやすいRecordに変換
      const variablesRecord = data.customer.variables.reduce((acc: Record<string, string>, v: {key: string, value: string}) => {
        acc[v.key] = v.value;
        return acc;
      }, {});
      
      setCustomer({
        ...data.customer,
        variables: variablesRecord
      });
      
      setCustomerForm({
        name: data.customer.name,
        phoneNumber: data.customer.phoneNumber || ''
      });
    } catch (error) {
      console.error('顧客データの取得中にエラーが発生しました:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 顧客のコール履歴を取得
  const fetchCustomerCalls = async () => {
    try {
      const response = await client.customers[':id'].calls.$get({ param: { id: customerId } });
      const data = await response.json();
      setCalls(data.calls);
    } catch (error) {
      console.error('コールデータの取得中にエラーが発生しました:', error);
    }
  };
  
  useEffect(() => {
    fetchCustomer();
    fetchCustomerCalls();
  }, [customerId]);
  
  // 顧客情報を更新
  const handleUpdateCustomer = async () => {
    if (!customerForm.name) return;
    
    try {
      const response = await client.customers[':id'].$put({
        param: { id: customerId },
        json: {
          name: customerForm.name,
          phoneNumber: customerForm.phoneNumber || undefined,
          variables: customer?.variables,
        }
      });
      
      const data = await response.json();
      setEditMode(false);
      fetchCustomer();
    } catch (error) {
      console.error('顧客更新中にエラーが発生しました:', error);
    }
  };
  
  // 変数を追加
  const handleAddVariable = () => {
    if (!newVariable.key || !customer) return;
    
    const updatedVariables = {
      ...(customer.variables || {}),
      [newVariable.key]: newVariable.value,
    };
    
    setCustomer({
      ...customer,
      variables: updatedVariables,
    });
    
    setNewVariable({ key: '', value: '' });
    setVariableDialog(false);
  };
  
  // 変数を削除
  const handleDeleteVariable = (key: string) => {
    if (!customer || !customer.variables) return;
    
    const updatedVariables = { ...customer.variables };
    delete updatedVariables[key];
    
    setCustomer({
      ...customer,
      variables: updatedVariables,
    });
  };
  
  // コール予約
  const handleRequestCall = async () => {
    try {
      const response = await client.calls.$post({
        json: {
          customerId
        }
      });
      
      const data = await response.json();
      fetchCustomerCalls();
    } catch (error) {
      console.error('コール予約中にエラーが発生しました:', error);
    }
  };
  
  // コールステータスに応じたカラークラスを返す関数
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100';
    }
  };
  
  // 日付をフォーマットする関数
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP')}`;
  };
  
  if (loading) {
    return <div className="flex justify-center py-8">読み込み中...</div>;
  }
  
  if (!customer) {
    return (
      <div className="text-center py-8">
        <p>顧客が見つかりませんでした</p>
        <Button className="mt-4" onClick={() => router.push('/')}>
          顧客一覧に戻る
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <Button onClick={() => router.push('/')}>戻る</Button>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">顧客情報</TabsTrigger>
          <TabsTrigger value="calls">コール履歴</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>顧客詳細</CardTitle>
                <CardDescription>顧客の基本情報</CardDescription>
              </div>
              {!editMode ? (
                <Button onClick={() => setEditMode(true)}>編集</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>キャンセル</Button>
                  <Button onClick={handleUpdateCustomer}>保存</Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editMode ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">顧客ID</p>
                    <p>{customer.customerId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">顧客名</p>
                    <p>{customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">電話番号</p>
                    <p>{customer.phoneNumber || '-'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      顧客名 *
                    </label>
                    <Input
                      id="name"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="顧客名を入力"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-sm font-medium">
                      電話番号
                    </label>
                    <Input
                      id="phoneNumber"
                      value={customerForm.phoneNumber}
                      onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                      placeholder="電話番号（任意）"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>カスタム変数</CardTitle>
                <CardDescription>顧客固有の変数</CardDescription>
              </div>
              <Dialog open={variableDialog} onOpenChange={setVariableDialog}>
                <DialogTrigger asChild>
                  <Button>変数を追加</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新規変数を追加</DialogTitle>
                    <DialogDescription>
                      変数名と値を入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label htmlFor="varKey" className="text-sm font-medium">
                        変数名 *
                      </label>
                      <Input
                        id="varKey"
                        value={newVariable.key}
                        onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
                        placeholder="例: 会社名"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="varValue" className="text-sm font-medium">
                        値
                      </label>
                      <Input
                        id="varValue"
                        value={newVariable.value}
                        onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                        placeholder="例: 株式会社ABC"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setVariableDialog(false)}>
                        キャンセル
                      </Button>
                      <Button type="button" onClick={handleAddVariable}>
                        追加
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!customer.variables || Object.keys(customer.variables).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  変数はまだありません。「変数を追加」ボタンから変数を登録してください。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>変数名</TableHead>
                      <TableHead>値</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(customer.variables).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            className="bg-transparent hover:bg-red-100"
                            onClick={() => handleDeleteVariable(key)}
                            title="変数を削除"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calls" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>コール履歴</CardTitle>
                <CardDescription>この顧客のコール履歴</CardDescription>
              </div>
              <Button onClick={handleRequestCall}>新規コール予約</Button>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  コール履歴はまだありません。「新規コール予約」ボタンからコールを予約してください。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ステータス</TableHead>
                      <TableHead>予約日時</TableHead>
                      <TableHead>開始時間</TableHead>
                      <TableHead>終了時間</TableHead>
                      <TableHead>通話時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.callId}>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(call.status)}`}>
                            {{
                              queued: '予約済み',
                              'in-progress': '進行中',
                              completed: '完了',
                              canceled: 'キャンセル',
                              failed: '失敗',
                            }[call.status]}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(call.requestedAt)}</TableCell>
                        <TableCell>{call.startedAt ? formatDate(call.startedAt) : '-'}</TableCell>
                        <TableCell>{call.endedAt ? formatDate(call.endedAt) : '-'}</TableCell>
                        <TableCell>
                          {call.durationSec ? `${call.durationSec}秒` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
