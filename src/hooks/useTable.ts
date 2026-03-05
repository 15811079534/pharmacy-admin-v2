import { ref, reactive } from 'vue'
import type { Ref } from 'vue'
import { hasMessageShown, markMessageShown } from '@/utils/request'

interface UseTableOptions<T, P = any> {
  fetchData: (params: P) => Promise<{ list: T[]; total: number }>
  queryParams?: P
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
}

export function useTable<T = any, P = any>(options: UseTableOptions<T, P>) {
  const { fetchData, queryParams: externalParams, onSuccess, onError } = options

  const loading = ref(false)
  const tableData: Ref<T[]> = ref([])
  const total = ref(0)

  // Use external queryParams if provided, otherwise create internal one
  const defaultQueryParams = reactive({
    pageNo: 1,
    pageSize: 10
  })
  const queryParams = (externalParams ?? defaultQueryParams) as P

  const getList = async () => {
    loading.value = true
    try {
      const { list, total: totalCount } = await fetchData(queryParams)
      tableData.value = list
      total.value = totalCount
      onSuccess?.(list)
    } catch (error) {
      const requestError = error as Error
      onError?.(requestError)
      if (!hasMessageShown(requestError)) {
        ElMessage.error(requestError.message || '获取数据失败')
        markMessageShown(requestError)
      }
    } finally {
      loading.value = false
    }
  }

  const handleQuery = () => {
    if (queryParams && typeof queryParams === 'object' && 'pageNo' in queryParams) {
      (queryParams as any).pageNo = 1
    }
    getList()
  }

  const handleReset = (resetFields: () => void) => {
    resetFields()
    handleQuery()
  }

  return {
    loading,
    tableData,
    total,
    queryParams,
    getList,
    handleQuery,
    handleReset
  }
}
