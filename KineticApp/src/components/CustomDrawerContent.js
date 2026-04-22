import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';

export default function CustomDrawerContent(props) {
  const { isDarkMode } = useContext(ThemeContext);
  const { currentUser, signOut } = useContext(AuthContext);
  const { navigation } = props;
  const isDark = isDarkMode;

  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    text: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
  };

  const navItem = (label, icon, routeName, isActive) => (
    <TouchableOpacity
      key={routeName}
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={() => {
        navigation.navigate('MainTabs', { screen: routeName });
        navigation.closeDrawer();
      }}
    >
      <Text style={[styles.navIcon, isActive && { color: COLORS.neonBlue }]}>{icon}</Text>
      <Text style={[styles.navLabel, isActive && { color: COLORS.neonBlue }]}>{label}</Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );

  const handleSignOut = () => {
    signOut();
    navigation.closeDrawer();
  };

  // Pega as iniciais do nome para o avatar
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Descobre a tab ativa pela state do Navigator
  let activeTabName = 'Home';
  try {
    const mainTabsRoute = props.state.routes.find(r => r.name === 'MainTabs');
    if (mainTabsRoute && mainTabsRoute.state) {
      activeTabName = mainTabsRoute.state.routes[mainTabsRoute.state.index].name;
    }
  } catch(e) {}

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>

        {/* Drawer Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>KINETIC</Text>
          <TouchableOpacity onPress={() => navigation.closeDrawer()}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <View style={styles.navSection}>
          {navItem('TRAIN', '🏋️', 'Train', activeTabName === 'Train')}
          {navItem('HOME', '🏠', 'Home', activeTabName === 'Home')}
          {navItem('STATS', '📊', 'Stats', activeTabName === 'Stats')}
          {navItem('SOCIAL', '👥', 'Social', activeTabName === 'Social')}
          {navItem('GEAR', '⚙️', 'Profile', activeTabName === 'Profile')}
        </View>

        {/* Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <TouchableOpacity style={styles.subNavItem}>
            <Text style={styles.subNavIcon}>⚙️</Text>
            <Text style={styles.subLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.subNavItem}>
            <Text style={styles.subNavIcon}>❓</Text>
            <Text style={styles.subLabel}>Support</Text>
          </TouchableOpacity>
        </View>

      </DrawerContentScrollView>

      {/* Footer: Perfil + Sair */}
      <View style={[styles.footer, { borderTopColor: isDark ? '#333' : '#EEE' }]}>
        <View style={styles.profileRow}>

          {/* Avatar com iniciais */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Nome e cargo */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: THEME.text }]} numberOfLines={1}>
              {currentUser?.name || 'Usuário'}
            </Text>
            <Text style={styles.profileTitle}>
              {currentUser?.level || 'INICIANTE'}
            </Text>
          </View>

          {/* Botão de sair */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutIcon}>⏻</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  brand: {
    color: COLORS.neonBlue,
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeIcon: {
    color: '#AAA',
    fontSize: 18,
  },
  navSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#113a40',
  },
  navIcon: {
    fontSize: 18,
    marginRight: 16,
    color: '#888',
  },
  navLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.neonBlue,
    borderRadius: 2,
  },
  accountSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionTitle: {
    color: '#555',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 16,
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  subNavIcon: {
    fontSize: 16,
    marginRight: 16,
  },
  subLabel: {
    color: '#CCC',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: '#2A2A2A',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.neonBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: COLORS.neonBlue,
    fontSize: 14,
    fontWeight: 'bold',
  },
  proBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.neonBlue,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  proBadgeText: {
    color: COLORS.darkBackground,
    fontSize: 7,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileTitle: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  signOutBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  signOutIcon: {
    fontSize: 16,
    color: '#FF4444',
  }
});
