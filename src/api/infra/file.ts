import request from '@/utils/request'

export const uploadFile = (file: File, directory?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (directory) {
    formData.append('directory', directory)
  }
  return request.upload<string>({
    url: '/infra/file/upload',
    data: formData
  })
}
