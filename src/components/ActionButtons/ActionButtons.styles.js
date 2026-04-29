import { StyleSheet } from 'react-native';

export const actionButtonStyles = StyleSheet.create({
  actions: {
    width: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
