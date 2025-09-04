import { useApi } from '@/composables/use-api'
import { useRecordCreate } from '@/composables/use-record-create.ts'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCartoonParams } from './use-cartoon-params.ts'

export const VIDEOS_QUERY_KEY = 'cartoon'

export const useCartoon = defineStore('cartoon/use-cartoon', () => {
  const api = useApi()
  const {
    pagination,
    cartoonParams,
  } = storeToRefs(useCartoonParams())

  const {
    isLoading,
    data,
    refetch: refetchVideos,
  } = useQuery({
    key: () => [VIDEOS_QUERY_KEY, cartoonParams.value],
    placeholderData(previousData): { records: RecordEntity[], total: number } {
      if (!previousData) return { records: [], total: 0 }
      return previousData
    },
    query: async () => {
      const { data } = await api.records.recordControllerGetAllRecords(cartoonParams.value)
      return data
    },
  })

  const totalRecords = computed(() => {
    if (!data.value) return 0
    return data.value.total
  })

  const totalPages = computed(() => {
    if (!data.value) return 0
    return Math.ceil(data.value.total / pagination.value.pageSize)
  })

  const { mutateAsync: updateVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'update'],
    mutation: ({ id, data }: { id: number, data: RecordUpdateDTO }) => {
      return api.records.recordControllerPatchRecord(id, data)
    },
    onSettled: () => refetchVideos(),
  })

  const { mutateAsync: deleteVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'delete'],
    mutation: (id: number) => {
      return api.records.recordControllerDeleteRecord(id)
    },
    onSettled: () => refetchVideos(),
  })

  const { mutateAsync: createVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'create'],
    mutation: async (link: string) => {
      const { createRecord } = useRecordCreate(VIDEOS_QUERY_KEY, refetchVideos)
      return await createRecord(link)
    },
    onSuccess: () => refetchVideos(),
  })

  const videos = computed(() => {
    if (!data.value) return []
    return data.value.records
  })

  return {
    isLoading,
    videos,
    refetchVideos,
    updateVideo,
    deleteVideo,
    createVideo,
    totalRecords,
    totalPages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoon, import.meta.hot))
}
