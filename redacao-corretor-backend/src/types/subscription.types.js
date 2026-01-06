/**
 * Interface leve para dados de assinatura
 * Apenas campos necessários para sincronização
 */

/**
 * @typedef {Object} SubscriptionContact
 * @property {string} doc - CPF do aluno
 * @property {string} email - Email do aluno
 * @property {string} name - Nome completo do aluno
 * @property {string} id - ID do contato
 */

/**
 * @typedef {Object} SubscriptionProduct
 * @property {string} id - ID do produto
 * @property {string} name - Nome do produto (usado para mapear turma)
 */

/**
 * @typedef {Object} SubscriptionData
 * @property {string} id - ID da assinatura
 * @property {string} last_status - Status da assinatura (active, cancelled, etc)
 * @property {SubscriptionContact} contact - Dados de contato do aluno
 * @property {SubscriptionProduct} product - Produto/curso assinado
 */

/**
 * Status válidos de assinatura
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  TRIALING: 'trialing',
};

/**
 * Valida se uma assinatura está ativa
 * @param {SubscriptionData} subscription
 * @returns {boolean}
 */
export function isActiveSubscription(subscription) {
  return subscription.last_status === SUBSCRIPTION_STATUS.ACTIVE ||
         subscription.last_status === SUBSCRIPTION_STATUS.TRIALING;
}

/**
 * Extrai dados do aluno de uma assinatura
 * @param {SubscriptionData} subscription
 * @returns {Object}
 */
export function extractStudentData(subscription) {
  return {
    email: subscription.contact.email,
    fullName: subscription.contact.name,
    enrollmentNumber: subscription.contact.doc, // CPF como matrícula
    password: subscription.contact.doc, // CPF como senha inicial
    productName: subscription.product.name,
  };
}

/**
 * Extrai dados do produto
 * @param {SubscriptionData} subscription
 * @returns {Object}
 */
export function extractProductData(subscription) {
  return {
    id: subscription.product.id,
    name: subscription.product.name,
  };
}
