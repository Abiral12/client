export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  }
  return null;
};