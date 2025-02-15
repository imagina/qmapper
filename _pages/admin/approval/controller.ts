import { reactive, toRefs, computed, ref } from 'vue';
// @ts-ignore
import crud from 'src/modules/qcrud/_components/crud.vue';
import services from './services';
import { i18n, store } from 'src/plugins/utils';
import { TAG_COLORS } from './constant'

export default function controller() {

  // Refs
  const refs = {
    crudComponent: ref(crud)
  };

  // States
  const state = reactive({
    show: false,
    currentAction: '',
    loading: false,
    requested: {},
    comment: '',
    attributes: {}
  });

  // Computed
  const computeds = {
    customCrudData: computed(() => {
      return {
        read: {
          actions: [
            {
              icon: 'fa-regular fa-circle-check',
              vIf: store.hasAccess('imapper.approvals.acceptance'),
              tooltip: 'Approve',
              name: 'approve',
              action: (item: any) => methods.showModal(TAG_COLORS.APPROVED.action, item),
              format: (item) => item.ApprovalInd === TAG_COLORS.APPROVED.action
            },
            {
              icon: 'fa-regular fa-ban',
              vIf: store.hasAccess('imapper.approvals.acceptance'),
              tooltip: 'Deny',
              name: 'deny',
              action: (item) => methods.showModal(TAG_COLORS.DENIED.action, item),
              format: (item) => item.ApprovalInd === TAG_COLORS.DENIED.action
            },
            {
              icon: 'fa-regular fa-ban',
              vIf: store.hasAccess('imapper.approvals.cancel'),
              tooltip: 'Cancel',
              name: 'cancel',
              action: (item) => methods.showModal(TAG_COLORS.CANCELLED.action, item),
              format: (item) => item.ApprovalInd === TAG_COLORS.CANCELLED.action
            }
          ]
        }
      };
    }),
    modalActions: computed(() => {
      const infoAction = TAG_COLORS[state.currentAction] || { btnColor: 'gray', label: 'None'};

      return [
        {
          props: {
            label: i18n.tr('isite.cms.label.cancel'),
            color: 'grey-4',
            textColor: "grey-9"
          },
          action: () => state.show = false
        },
        {
          props: {
            label: infoAction.label,
            style: `background-color: ${infoAction.btnColor}`,
            textColor: "white"
          },
          action: () => {
            methods.sendAction(state.currentAction, state.attributes);
          }
        }
      ];
    }),
    fieldComment: computed(() => {
      return {
        value: '',
        type: 'input',
        props: {
          type: 'textarea',
          rows: '3',
          label: 'Leave a note'
        }
      };
    })
  };

  // Methods
  const methods = {
    //Send action
    async sendAction(action: string, att: any) {
      try {
        state.loading = true
        state.show = false;
        const attributes = {
          ...att,
          RejectionComments: state.comment
        };
        await services.sendActionRuleApprove({ action, attributes });
        state.loading = false
        await methods.getDataTable(true);
      } catch (e) {
        state.loading = false
        console.error(e);
      }
    },
    async getDataTable(refresh = false) {
      await refs.crudComponent.value.getDataTable(refresh);
    },
    showModal(action: string, item: any) {
      state.show = true;
      state.currentAction = action;
      state.attributes = item;
    },
    clear() {
      state.comment = '';
      state.currentAction = '';
      state.attributes = {};
    }
  };

  return { ...refs, ...(toRefs(state)), ...computeds, ...methods };
}
