import { toast } from 'sonner';

interface RequestOptions {
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  id?: string | number;
}

/**
 * Universal System Feedback Engine
 * Intercepts any promise and provides immediate toast feedback (loading, success, error).
 */
export async function systemRequest<T>(
  promise: Promise<T>,
  options?: RequestOptions
): Promise<T> {
  const {
    successMessage = "Operação realizada com sucesso",
    errorMessage = "Falha ao executar operação",
    loadingMessage = "Processando informações...",
    id: customId
  } = options || {};

  // Deduplicate by successMessage if no custom ID is provided
  const toastId = customId || successMessage;

  toast.loading(loadingMessage, { id: toastId });

  try {
    const result = await promise;
    toast.success(successMessage, { id: toastId });
    return result;
  } catch (error: any) {
    console.error('[System Feedback Engine Error]:', error);
    toast.error(error?.message || errorMessage, { id: toastId });
    throw error;
  }
}

/**
 * Global Interceptor for System Actions
 * This can be used to wrap any function call that interacts with the backend.
 */
export const systemAction = {
  save: <T>(promise: Promise<T>) => systemRequest(promise, { successMessage: "Alterações salvas com sucesso" }),
  delete: <T>(promise: Promise<T>) => systemRequest(promise, { successMessage: "Registro removido do sistema" }),
  sync: <T>(promise: Promise<T>) => systemRequest(promise, { successMessage: "Sincronização concluída", loadingMessage: "Sincronizando dados..." }),
};
