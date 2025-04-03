/**
 * DTOマッパー
 * ドメインモデルとDTOの相互変換を行うユーティリティ関数を提供します
 */

import { Customer, CustomerVariable } from '../models/Customer';
import { Call } from '../models/Call';
import { CustomerDTO, CustomerVariableDTO, CallDTO } from './types';

/**
 * Customerドメインモデル → CustomerDTO変換
 */
export function toCustomerDTO(customer: Customer): CustomerDTO {
  return {
    customerId: customer.customerId,
    name: customer.name,
    phoneNumber: customer.phoneNumber || '', // phoneNumberが必須なので空文字をデフォルト値に
    variables: customer.getAllVariables().map(toCustomerVariableDTO),
  };
}

/**
 * CustomerVariable → CustomerVariableDTO変換
 */
export function toCustomerVariableDTO(variable: CustomerVariable): CustomerVariableDTO {
  return {
    key: variable.key,
    value: variable.value,
  };
}

/**
 * CustomerDTO → ドメインモデル変換（必要に応じて）
 */
export function toCustomerEntity(dto: CustomerDTO): Customer {
  // CustomerVariable作成時に必要なid, customerIdはDTO内に無いのでCustomerVariable.createを使用
  const customer = new Customer(dto.customerId, dto.name, dto.phoneNumber);
  
  // 変数を個別に追加
  dto.variables.forEach(v => {
    customer.setVariable(v.key, v.value);
  });
  
  return customer;
}

/**
 * Call → CallDTO変換
 */
export function toCallDTO(call: Call): CallDTO {
  return {
    callId: call.callId,
    customerId: call.customerId,
    status: call.status,
    requestedAt: call.requestedAt.toISOString(),
    startedAt: call.startedAt?.toISOString(),
    endedAt: call.endedAt?.toISOString(),
    durationSec: call.durationSec
  };
}

/**
 * 複数のドメインモデルリストをDTOリストに変換するヘルパー
 */
export function toCustomerDTOList(customers: Customer[]): CustomerDTO[] {
  return customers.map(toCustomerDTO);
}

export function toCallDTOList(calls: Call[]): CallDTO[] {
  return calls.map(toCallDTO);
}
