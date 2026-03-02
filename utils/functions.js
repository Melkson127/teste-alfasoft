// Função utilitária global para padronização de erros
export function errorResponse(message, path = []) {
    return { errors: [{ message, path }] };
}
