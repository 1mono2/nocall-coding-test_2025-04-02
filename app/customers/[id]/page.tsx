"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { AppType } from "@/app/api/v1/routes";
import type { CallDTO, CustomerDTO } from "@/app/dto/types";
import { hc } from "hono/client";

export default function CustomerDetail() {
	const params = useParams();
	const router = useRouter();
	const customerId = params.id as string;

	const [customer, setCustomer] = useState<CustomerDTO>();
	const [calls, setCalls] = useState<CallDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [editMode, setEditMode] = useState(false);

	const [variableDialog, setVariableDialog] = useState(false);
	const [newVariable, setNewVariable] = useState({ key: "", value: "" });
	const client = hc<AppType>("/").api.v1;

	// 顧客情報を取得
	const fetchCustomer = useCallback(async () => {
		try {
			setLoading(true);
			const response = await client.customers[":id"].$get({
				param: { id: customerId },
			});
			const data = await response.json();

			setCustomer(data.customer);
		} catch (error) {
			console.error("顧客データの取得中にエラーが発生しました:", error);
		} finally {
			setLoading(false);
		}
	}, [customerId, client]);

	// 顧客のコール履歴を取得
	const fetchCustomerCalls = useCallback(async () => {
		try {
			const response = await client.customers[":id"].calls.$get({
				param: { id: customerId },
			});
			const data = await response.json();
			setCalls(data.calls);
		} catch (error) {
			console.error("コールデータの取得中にエラーが発生しました:", error);
		}
	}, [customerId, client]);

	useEffect(() => {
		fetchCustomer();
		fetchCustomerCalls();
	}, [fetchCustomer, fetchCustomerCalls]);

	// 顧客情報を更新
	const handleUpdateCustomer = async () => {
		if (!customer) return;

		try {
			const response = await client.customers[":id"].$put({
				param: { id: customerId },
				json: customer,
			});

			await response.json();
			setEditMode(false);
			fetchCustomer();
		} catch (error) {
			console.error("顧客更新中にエラーが発生しました:", error);
		}
	};

	// 変数を追加
	const handleAddVariable = async () => {
		if (!newVariable.key || !customer) return;

		const updatedVariables = [
			...customer.variables,
			{ key: newVariable.key, value: newVariable.value },
		];

		try {
			await client.customers[":id"].$put({
				param: { id: customerId },
				json: {
					...customer,
					variables: updatedVariables,
				},
			});

			// 更新成功時に再取得して最新状態を反映
			fetchCustomer();
		} catch (error) {
			console.error("変数追加中にエラーが発生しました:", error);
		}

		setNewVariable({ key: "", value: "" });
		setVariableDialog(false);
	};

	// 変数を削除
	const handleDeleteVariable = async (key: string) => {
		if (!customer) return;

		const updatedVariables = customer.variables.filter((v) => v.key !== key);

		console.log(updatedVariables);

		try {
			await client.customers[":id"].$put({
				param: { id: customerId },
				json: {
					...customer,
					variables: updatedVariables,
				},
			});

			// 更新成功時に再取得して最新状態を反映
			fetchCustomer();
		} catch (error) {
			console.error("変数削除中にエラーが発生しました:", error);
		}
	};

	// コール予約
	const handleRequestCall = async () => {
		try {
			const response = await client.calls.$post({
				json: {
					customerId,
				},
			});

			await response.json();
			fetchCustomerCalls();
		} catch (error) {
			console.error("コール予約中にエラーが発生しました:", error);
		}
	};

	// コールステータスに応じたカラークラスを返す関数
	const getStatusColorClass = (status: string) => {
		switch (status) {
			case "queued":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
			case "in-progress":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
			case "completed":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
			case "canceled":
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
			case "failed":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
			default:
				return "bg-gray-100 dark:bg-gray-800";
		}
	};

	// 日付をフォーマットする関数
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return `${date.toLocaleDateString("ja-JP")} ${date.toLocaleTimeString("ja-JP")}`;
	};

	if (loading) {
		return <div className="flex justify-center py-8">読み込み中...</div>;
	}

	if (!customer) {
		return (
			<div className="text-center py-8">
				<p>顧客が見つかりませんでした</p>
				<Button className="mt-4" onClick={() => router.push("/")}>
					顧客一覧に戻る
				</Button>
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4 dark:text-white">
						読み込み中...
					</h2>
					<Button onClick={() => router.push("/")} className="mt-4">
						戻る
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto pb-8">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
				<Button onClick={() => router.push("/")} variant="outline">
					戻る
				</Button>
			</div>

			<Tabs defaultValue="details" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="details">顧客情報</TabsTrigger>
					<TabsTrigger value="calls">コール履歴</TabsTrigger>
				</TabsList>

				<TabsContent value="details">
					<div className="bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden">
						<div className="p-4 sm:p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-bold text-foreground">基本情報</h2>
								{!editMode ? (
									<Button
										onClick={() => setEditMode(true)}
										variant="outline"
										size="sm"
										className="dark:border-gray-700"
									>
										編集
									</Button>
								) : null}
							</div>
						</div>

						<div className="p-4 sm:p-6">
							{!editMode ? (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												顧客ID
											</p>
											<p className="mt-1 text-foreground">{customerId}</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												顧客名
											</p>
											<p className="mt-1 text-foreground">{customer.name}</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												電話番号
											</p>
											<p className="mt-1 text-foreground">
												{customer.phoneNumber || "-"}
											</p>
										</div>
									</div>
								</div>
							) : (
								<form onSubmit={handleUpdateCustomer} className="space-y-4">
									<div className="grid w-full items-center gap-2">
										<Label htmlFor="name" className="text-foreground/80">
											顧客名 *
										</Label>
										<Input
											id="name"
											value={customer.name}
											onChange={(e) =>
												setCustomer({ ...customer, name: e.target.value })
											}
											placeholder="顧客名を入力"
											className="bg-background border-input"
											required
										/>
									</div>
									<div className="grid w-full items-center gap-2">
										<Label
											htmlFor="phoneNumber"
											className="text-gray-700 dark:text-gray-300"
										>
											電話番号
										</Label>
										<Input
											id="phoneNumber"
											value={customer.phoneNumber}
											onChange={(e) =>
												setCustomer({
													...customer,
													phoneNumber: e.target.value,
												})
											}
											placeholder="電話番号（任意）"
											className="bg-background border-input"
										/>
									</div>
									<div className="flex justify-end gap-3 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setEditMode(false)}
										>
											キャンセル
										</Button>
										<Button type="submit">保存</Button>
									</div>
								</form>
							)}
						</div>
					</div>

					<div className="mt-6 bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden">
						<div className="p-4 sm:p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-bold text-foreground">変数</h2>
								<Dialog open={variableDialog} onOpenChange={setVariableDialog}>
									<DialogTrigger asChild>
										<Button variant="outline" size="sm">
											変数を追加
										</Button>
									</DialogTrigger>
									<DialogContent className="bg-background border-border">
										<DialogHeader>
											<DialogTitle className="text-foreground">
												新規変数を追加
											</DialogTitle>
											<DialogDescription className="text-muted-foreground">
												変数名と値を入力してください
											</DialogDescription>
										</DialogHeader>
										<div className="pt-4 border-t">
											<div className="flex flex-col space-y-4">
												<div className="grid w-full items-center gap-2">
													<Label
														htmlFor="variable-name"
														className="text-foreground/80"
													>
														変数名
													</Label>
													<Input
														id="variable-name"
														value={newVariable.key}
														onChange={(e) =>
															setNewVariable({
																...newVariable,
																key: e.target.value,
															})
														}
														className="bg-background border-input"
													/>
												</div>
												<div className="grid w-full items-center gap-2">
													<Label
														htmlFor="variable-value"
														className="text-foreground/80"
													>
														値
													</Label>
													<Input
														id="variable-value"
														value={newVariable.value}
														onChange={(e) =>
															setNewVariable({
																...newVariable,
																value: e.target.value,
															})
														}
														className="bg-background border-input"
													/>
												</div>
												<div className="flex justify-end gap-3 pt-2">
													<Button
														onClick={handleAddVariable}
														disabled={!newVariable.key || !newVariable.value}
													>
														追加
													</Button>
												</div>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</div>

						<div className="p-4 sm:p-6">
							{loading ? (
								<p className="text-muted-foreground">読み込み中...</p>
							) : customer.variables && customer.variables.length > 0 ? (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									{customer.variables.map((variable) => (
										<div
											key={variable.key}
											className="flex items-center justify-between bg-muted p-3 rounded-md border"
										>
											<div className="text-foreground">
												<span className="font-medium">{variable.key}</span>:{" "}
												{variable.value}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteVariable(variable.key)}
												className="hover:bg-muted/50 dark:hover:bg-gray-800"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground">変数がありません</p>
							)}
						</div>
					</div>
				</TabsContent>

				<TabsContent value="calls" className="mt-4">
					<div className="bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden">
						<div className="p-4 sm:p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-bold text-foreground">
									コール履歴
								</h2>
								<Button onClick={handleRequestCall} variant="outline">
									新規コール予約
								</Button>
							</div>
						</div>

						<div className="p-4 sm:p-6">
							{calls.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground bg-muted rounded-lg p-6 border">
									コール履歴はありません。「新規コール予約」ボタンからコールを予約してください。
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b-2 border-border">
												<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
													ステータス
												</th>
												<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
													予約日時
												</th>
												<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
													開始時間
												</th>
												<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
													終了時間
												</th>
												<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
													通話時間
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{calls.map((call) => (
												<tr key={call.callId} className="hover:bg-muted/50">
													<td className="px-4 py-3 text-sm text-foreground/80">
														<span
															className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(call.status)}`}
														>
															{
																{
																	queued: "予約済み",
																	"in-progress": "進行中",
																	completed: "完了",
																	canceled: "キャンセル",
																	failed: "失敗",
																}[call.status]
															}
														</span>
													</td>
													<td className="px-4 py-3 text-sm text-foreground/80">
														{formatDate(call.requestedAt)}
													</td>
													<td className="px-4 py-3 text-sm text-foreground/80">
														{call.startedAt ? formatDate(call.startedAt) : "-"}
													</td>
													<td className="px-4 py-3 text-sm text-foreground/80">
														{call.endedAt ? formatDate(call.endedAt) : "-"}
													</td>
													<td className="px-4 py-3 text-sm text-foreground/80">
														{call.durationSec ? `${call.durationSec}秒` : "-"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
