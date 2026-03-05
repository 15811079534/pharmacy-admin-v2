import { ref } from 'vue'
import { hasMessageShown, markMessageShown } from '@/utils/request'

interface UseDialogOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useDialog<T = any>(options?: UseDialogOptions<T>) {
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const formType = ref<'create' | 'update'>('create')
  const formLoading = ref(false)

  const open = (type: 'create' | 'update', title?: string) => {
    formType.value = type
    dialogTitle.value = title || (type === 'create' ? '新增' : '编辑')
    dialogVisible.value = true
  }

  const close = () => {
    dialogVisible.value = false
  }

  const submit = async (
    submitFn: () => Promise<T>,
    successMsg?: string
  ) => {
    formLoading.value = true
    try {
      const result = await submitFn()
      ElMessage.success(successMsg || '操作成功')
      close()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const requestError = error as Error
      options?.onError?.(requestError)
      if (!hasMessageShown(requestError)) {
        ElMessage.error(requestError.message || '操作失败')
        markMessageShown(requestError)
      }
      throw requestError
    } finally {
      formLoading.value = false
    }
  }

  return {
    dialogVisible,
    dialogTitle,
    formType,
    formLoading,
    open,
    close,
    submit
  }
}
