import { Alert } from 'react-native';

import type { SavedAnalysis } from './historyTypes';
import { useHistory } from './useHistory';

/** Asks before deleting a saved phrase, and reports a failure. */
export function useDeleteConfirm() {
  const { remove } = useHistory();

  return (item: SavedAnalysis) =>
    Alert.alert('Delete phrase', 'Remove this phrase from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove(item.id).catch((e) => Alert.alert('Could not delete', e.message)),
      },
    ]);
}
