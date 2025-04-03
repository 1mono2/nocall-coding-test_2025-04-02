'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hc } from 'hono/client';
import { AppType } from '@/app/api/v1/routes';
import { CallDTO } from '@/app/dto/types';
// CardとTableコンポーネントのインポートを削除
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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">コール一覧</h1>
        <p className="text-muted-foreground">登録されているすべてのコールを表示します</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-foreground">読み込み中...</div>
      ) : calls.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg p-6">
          コールデータがありません。顧客詳細画面から新しいコールを予約してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">顧客名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ステータス</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">予約日時</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">開始時間</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">終了時間</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">通話時間</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {calls.map((call) => (
                  <tr key={call.callId} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <Link 
                        href={`/customers/${call.customerId}`}
                        className="text-primary hover:underline"
                      >
                        {customers[call.customerId]?.name || '不明な顧客'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(call.status)}`}>
                        {{
                          queued: '予約済み',
                          'in-progress': '進行中',
                          completed: '完了',
                          canceled: 'キャンセル',
                          failed: '失敗',
                        }[call.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{formatDate(call.requestedAt)}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{call.startedAt ? formatDate(call.startedAt) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{call.endedAt ? formatDate(call.endedAt) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      {call.durationSec ? `${call.durationSec}秒` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {renderActionButtons(call)}
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
