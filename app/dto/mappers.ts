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
    phoneNumber: customer.phoneNumber,
    variables: customer.getAllVariables().map(toCustomerVariableDTO),
  };
}

/**
 * CustomerVariable → CustomerVariableDTO変換
 */
export function toCustomerVariableDTO(variable: CustomerVariable): CustomerVariableDTO {
  return {
    id: variable.id,
    customerId: variable.customerId,
    key: variable.key,
    value: variable.value,
  };
}

/**
 * CustomerDTO → ドメインモデル変換（必要に応じて）
 */
export function toCustomerEntity(dto: CustomerDTO): Customer {
  const variables = dto.variables.map(v => 
    new CustomerVariable(v.id, v.customerId, v.key, v.value)
  );
  
  return new Customer(
    dto.customerId,
    dto.name,
    dto.phoneNumber,
    variables
  );
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
