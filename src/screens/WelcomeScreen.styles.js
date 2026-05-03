import { StyleSheet } from 'react-native';

export const welcomeScreenColors = {
  bg: '#121212',
  text: '#FFFFFF',
  primary: '#6366F1',
  border: '#333333',
  borderSelected: '#6366F1',
  outline: '#FFFFFF',
  inputBg: '#1E1E1E',
  placeholder: '#888888',
};

export const welcomeScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: welcomeScreenColors.bg,
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: welcomeScreenColors.text,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  avatarCell: {
    width: '22%',
    aspectRatio: 1,
    maxWidth: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: welcomeScreenColors.border,
    backgroundColor: welcomeScreenColors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCellOn: {
    borderColor: welcomeScreenColors.borderSelected,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: welcomeScreenColors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: welcomeScreenColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: welcomeScreenColors.text,
    backgroundColor: welcomeScreenColors.inputBg,
  },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: welcomeScreenColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineBtn: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: welcomeScreenColors.outline,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    color: welcomeScreenColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  actionBlock: {
    marginTop: 8,
  },
  pressed: {
    opacity: 0.85,
  },
});
