import { useAlert } from '@/src/shared/ui/AlertProvider';

import type { SavedAnalysis } from './historyTypes';
import { useHistory } from './useHistory';

/** Asks before deleting a saved phrase, and reports a failure. */
export function useDeleteConfirm() {
  const { remove } = useHistory();
  const alert = useAlert();

  return (item: SavedAnalysis) =>
    alert.show({
      type: 'danger',
      icon: 'trash',
      title: 'Delete this phrase?',
      message: 'It will be removed from your history.',
      buttons: [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove(item.id).catch((e) => alert.error('Could not delete', e.message)),
        },
        { text: 'Keep it', style: 'cancel' },
      ],
    });
}
