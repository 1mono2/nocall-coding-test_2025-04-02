'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hc } from 'hono/client';
import { AppType } from '@/app/api/v1/routes';
import { CallDTO } from '@/app/dto/types';
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

// CallDTO型を拡張して使用
type Call = CallDTO & {
  customer?: {
    name: string;
  };
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Record<string, { name: string }>>({});
  const client = hc<AppType>('/').api.v1;

  // コール一覧を取得
  const fetchCalls = async () => {
    try {
      setLoading(true);
      const response = await client.calls.$get();
      const data = await response.json();
      setCalls(data.calls);
    } catch (error) {
      console.error('コールデータの取得中にエラーが発生しました:', error);
    } finally {
      setLoading(false);
    }
  };

  // 顧客情報を取得（顧客名表示用）
  const fetchCustomers = async () => {
    try {
      const response = await client.customers.$get();
      const data = await response.json();
      
      const customerMap: Record<string, { name: string }> = {};
      data.customers.forEach((customer: { customerId: string; name: string }) => {
        customerMap[customer.customerId] = { name: customer.name };
      });
      setCustomers(customerMap);
    } catch (error) {
      console.error('顧客データの取得中にエラーが発生しました:', error);
    }
  };
  
  useEffect(() => {
    fetchCalls();
    fetchCustomers();
  }, []);
  
  // コールステータスを更新する関数
  const updateCallStatus = async (callId: string, action: 'start' | 'complete' | 'cancel') => {
    try {
      // アクションによって呼び出すメソッドを切り替え
      let response;
      if (action === 'start') {
        response = await client.calls[':id'].start.$post({ param: { id: callId } });
      } else if (action === 'complete') {
        response = await client.calls[':id'].complete.$post({ param: { id: callId } });
      } else if (action === 'cancel') {
        response = await client.calls[':id'].cancel.$post({ param: { id: callId } });
      }
      
      if (response) {
        const data = await response.json();
        fetchCalls(); // コール一覧を再取得して表示を更新
      }
    } catch (error) {
      console.error(`コールの${action}中にエラーが発生しました:`, error);
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
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP')}`;
  };
  
  // ステータスに応じた操作ボタンを表示
  const renderActionButtons = (call: Call) => {
    switch (call.status) {
      case 'queued':
        return (
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              onClick={() => updateCallStatus(call.callId, 'start')}
            >
              開始
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => updateCallStatus(call.callId, 'cancel')}
            >
              キャンセル
            </Button>
          </div>
        );
      case 'in-progress':
        return (
          <Button 
            size="sm" 
            onClick={() => updateCallStatus(call.callId, 'complete')}
          >
            完了
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>コール一覧</CardTitle>
          <CardDescription>登録されているすべてのコールを表示します</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">読み込み中...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              コールデータがありません。顧客詳細画面から新しいコールを予約してください。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>予約日時</TableHead>
                  <TableHead>開始時間</TableHead>
                  <TableHead>終了時間</TableHead>
                  <TableHead>通話時間</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.callId}>
                    <TableCell>
                      <Link 
                        href={`/customers/${call.customerId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customers[call.customerId]?.name || '不明な顧客'}
                      </Link>
                    </TableCell>
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
                    <TableCell className="text-right">
                      {renderActionButtons(call)}
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
