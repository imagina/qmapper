import { computed, reactive, ref, onMounted, toRefs } from 'vue';
import service from './services';
import { i18n, alert, cache } from 'src/plugins/utils';

interface StateProps {
  showModal: boolean,
  loading: boolean,
  formData: any,
  apiRoute: string,
  data: any,
  loadedUnifiedValue: any[],
  unified: any,
  apiRouteDelete: string | null
}

export default function controller(props: any, emit: any) {

  // Refs
  const refs = {
    formContent: ref()
  };

  // States
  const state = reactive<StateProps>({
    showModal: false,
    loading: false,
    formData: {},
    apiRoute: '',
    data: null,
    loadedUnifiedValue: [],
    unified: {
      value: null,
      desc: null
    },
    apiRouteDelete: null
  });

  // Computed
  const computeds = {
    //Map the info to dynamic form
    formFields: computed(() => {
      const data = state.data;
      const unifiedFilters = { TableColumnName: data?.TableColumnName, Division: data?.Division };

      if (!state.formData.MatchType) {
        state.formData.MatchType = 'EXACT';
      }

      if (!state.unified.value !== state.formData.UnifiedValue) {
        const unified = state.formData.UnifiedValue;
        state.unified.value = state.formData.UnifiedValue;
        const desc = state.loadedUnifiedValue.find(uni => uni.UnifiedValue == unified)?.UnifiedValueDesc || '';
        state.unified.desc = desc;
        state.formData.UnifiedValueDesc = desc;
      }

      return {
        MatchTypeText: {
          type: 'text',
          col: 'col-12 col-md-6',
          vIf: false,
          props: {
            message: `Select the match type for "${data?.TableColumnValue}"`
          }
        },
        MatchType: {
          value: 'EXACT',
          type: 'select',
          required: true,
          colClass: 'col-12 col-md-6',
          vIf: false,
          props: {
            label: 'Match type*',
            options: [
              { label: 'Exact Match', value: 'EXACT' }
              // { label: 'PATTERN', value: 'PATTERN' }
            ]
          }
        },
        UnifiedValueText: {
          type: 'text',
          col: 'col-12 col-md-6',
          props: {
            message: `Select the unified "${data?.TableColumnName}" for "<span class="tw-text-[#0092DB]">${data?.TableColumnValue}</span>"`
          }
        },
        UnifiedValue: {
          value: null,
          type: 'select',
          required: true,
          colClass: 'col-12 col-md-6 self-center',
          props: {
            'fill-input': true,
            'hide-selected': true,
            label: 'Unified Value*'
          },
          ...(data?.TableColumnName ? methods.getLoadOption({
            name: 'UnifiedValue',
            filter: { _groupBy: 'UnifiedValue,UnifiedValueDesc', ...unifiedFilters },
            moreSettings: {
              select: { label: 'UnifiedValue', id: 'UnifiedValue' },
              loadedOptions: (data) => state.loadedUnifiedValue = data
            }
          }) : {})
        },
        UnifiedValueDescText: {
          type: 'text',
          colClass: 'col-12 col-md-6',
          props: {
            message: `Select the unified "${data?.TableColumnName} Description" for "<span class="tw-text-[#0092DB]">${data?.TableColumnValue}</span>"`
          }
        },
        UnifiedValueDesc: {
          value: '',
          type: 'input',
          colClass: 'col-12 col-md-6 self-center',
          props: {
            readonly: !!state.unified.desc,
            label: 'Unified Value Description'
          }
        },
        UnifiedValue_GroupText: {
          type: 'text',
          col: 'col-12 col-md-6',
          props: {
            message: `Select the unified "${data?.TableColumnName} Group" for "<span class="tw-text-[#0092DB]">${data?.TableColumnValue}</span>"`
          }
        },
        UnifiedValue_Group: {
          value: null,
          type: 'select',
          colClass: 'col-12 col-md-6 self-center',
          props: {
            'fill-input': true,
            'hide-selected': true,
            label: 'Unified Value Group'
          },
          ...(data?.TableColumnName ? methods.getLoadOption({
            name: 'UnifiedValue_Group',
            moreFilters: unifiedFilters
          }) : {})
        },
        UnifiedValue_CategoryText: {
          type: 'text',
          col: 'col-12 col-md-6',
          props: {
            message: `Select the unified "${data?.TableColumnName} Category" for "<span class="tw-text-[#0092DB]">${data?.TableColumnValue}</span>"`
          }
        },
        UnifiedValue_Category: {
          value: null,
          type: 'select',
          colClass: 'col-12 col-md-6 self-center',
          props: {
            'fill-input': true,
            'hide-selected': true,
            label: 'Unified Value Category'
          },
          ...(data?.TableColumnName ? methods.getLoadOption({
            name: 'UnifiedValue_Category',
            moreFilters: unifiedFilters
          }) : {})
        }
      };
    }),
    //get modal Actions
    modalActions: computed(() => {
      return [
        {
          props: {
            label: 'Cancel',
            color: 'secondary',
            outline: true
          },
          action: () => methods.closeModal()
        },
        {
          props: {
            label: 'Send Request',
            color: 'secondary'
          },
          action: () => refs?.formContent?.value.submit()
        }
      ];
    })
  };

  // Methods
  const methods = {
    //Get data by Id
    async getData({ id = null, apiRoute = '', apiRouteDelete = null }: { id: string | null, apiRoute: string, apiRouteDelete: string | null }) {
      if (!apiRoute?.length) return;

      state.apiRoute = apiRoute;
      state.apiRouteDelete = apiRouteDelete;
      state.showModal = true;
      state.loading = true;

      if (!!id) {
        await service.getDataCustom(apiRoute, id, { refresh: true, params: { include: 'tableName' } })
          .then(res => {
            state.data = res;
            state.formData = res;
          })
          .catch(e => {
            console.warn('Error Custom ', e);
            alert.error({ message: i18n.tr('isite.cms.message.errorRequest'), pos: 'bottom' });
          });
      } else {
        state.formData = {};
      }
      state.loading = false;
    },
    //Close Modal
    async closeModal() {
      if(state.apiRouteDelete) await cache.remove({allKey: state.apiRouteDelete})
      state.showModal = false;
      state.formData = {};
      state.data = null;
      state.apiRoute = '';
      state.loading = false;
      state.loadedUnifiedValue = [];
      state.unified = {
        value: null,
        desc: null
      };
    },
    //Get Load options
    getLoadOption({
                    name,
                    moreFilters = {},
                    apiRoute = 'apiRoutes.qmapper.references',
                    filter = {},
                    moreSettings = {}
                  }) {
      if (!Object.keys(filter)?.length) {
        filter = {
          _distinct: name,
          ...moreFilters
        };
      }
      return {
        loadOptions: {
          apiRoute,
          select: { label: name, id: name },
          requestParams: {
            filter
          },
          ...moreSettings
        }
      };
    },
    //Hidden Fields
    hidenFields(field: any) {
      return (field.type != 'hidden') &&
        (field?.vIf != undefined ? field?.vIf : true);
    },
    //Save data
    async submitData() {
      const data = state.data;
      const formData = state.formData;
      if (!data?.TableColumnValue) {
        alert.error('No Source Value found');
        return;
      }

      if (data?.id) {
        await methods.updateData({ ...data, ...formData });
      }

    },
    //Create Block
    async updateData(data, params = {}) {
      state.loading = true;

      await service.postData(state.apiRoute, { attributes: data }).then(response => {
        const msg = response?.message || i18n.tr('isite.cms.message.recordCreated');
        alert.info(msg);
        emit('created');
        methods.closeModal()
      }).catch(error => {
        const msg = error?.response?.data?.errors?.message || i18n.tr('isite.cms.message.recordNoCreated');
        alert.error(msg);
      });

      state.loading = false;
    }
  };

  // Mounted
  onMounted(() => {
  });

  // Watch
  // watch(key, (newField, oldField): void => {
  //
  // }, {deep: true})

  return { ...refs, ...(toRefs(state)), ...computeds, ...methods };
}
