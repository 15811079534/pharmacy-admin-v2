import { ref } from 'vue'

export interface FormField {
  prop: string
  label: string
  type: 'input' | 'select' | 'number' | 'date' | 'textarea' | 'radio' | 'upload'
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  rules?: any[]
  span?: number
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  precision?: number
}

export function useFormGenerator(fields: FormField[]) {
  const formData = ref<Record<string, any>>({})
  const formRules = ref<Record<string, any>>({})

  // 初始化表单数据和规则
  fields.forEach(field => {
    // 设置默认值
    if (field.type === 'number') {
      formData.value[field.prop] = 0
    } else if (field.type === 'radio' || field.type === 'select') {
      formData.value[field.prop] = field.options?.[0]?.value
    } else {
      formData.value[field.prop] = ''
    }

    // 设置验证规则
    if (field.rules) {
      formRules.value[field.prop] = field.rules
    }
  })

  const resetFormData = () => {
    fields.forEach(field => {
      if (field.type === 'number') {
        formData.value[field.prop] = 0
      } else if (field.type === 'radio' || field.type === 'select') {
        formData.value[field.prop] = field.options?.[0]?.value
      } else {
        formData.value[field.prop] = ''
      }
    })
  }

  return {
    formData,
    formRules,
    resetFormData
  }
}
