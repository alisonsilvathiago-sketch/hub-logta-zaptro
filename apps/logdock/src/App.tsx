import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Folder, File, Upload, Share2, Search, Filter,
  Download, Trash2, RotateCcw,
  Eye, Plus, LayoutGrid, List, Grid,
  Box, MoreHorizontal, Zap, FileText,
  Image as ImageIcon, RefreshCw, HardDrive,
  Settings, LogOut, ChevronRight, ShieldCheck, Settings2, Shield,
  Play, Volume2, Maximize2, ExternalLink, User, Lock, Minus, HelpCircle,
  UserPlus, Star, Clock, Laptop, X, Link as LinkIcon, Edit3, Copy, ArrowRight, Info, AlertTriangle, Check, Send, CheckCircle2, BoxSelect,
  Bell, Layout, PanelLeft, MessageSquare, Gift, ChevronLeft, Edit2, Sun, Moon, ChevronUp, ChevronDown,
  Truck, Users as UsersIcon, ShieldAlert, Activity, Calendar, MapPin,
  Home, Files, Image, Mail, Phone, Sparkles, Mic, ArrowUp, Camera,
  FolderPlus
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';
import Logo from './components/Logo';
import Button from '@shared/components/Button';
import LogtaModal from '@shared/components/Modal';
import { toast } from 'react-hot-toast';
import LogDockLogin from './pages/Login';
import LandingPage from './pages/LandingPage';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import ProfilePage from './pages/UserAccount';
import BillingPage from './pages/UserBilling';
import AutomationsPage from './pages/UserAutomations';
import SettingsPage from './pages/Settings';
import UserAPIs from './pages/UserAPIs';
import UserInteractions from './pages/UserInteractions';
import FleetPage from './pages/Fleet';
import DriversPage from './pages/Drivers';
import MaintenancePage from './pages/Maintenance';
import DeliveriesPage from './pages/Deliveries';
import ClientsPage from './pages/Clients';
import ControlTowerPage from './pages/ControlTower';
import MasterHubPage from './pages/MasterHub';
import ClientPortalPage from './pages/ClientPortal';
import ReportsPage from './pages/Reports';

// --- Styles ---
const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: { display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#0F0F0F', overflow: 'hidden' },
  miniSidebar: { width: '120px', height: '100vh', backgroundColor: '#141414', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', zIndex: 120, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)' },
  miniLogoBox: { marginBottom: '60px', cursor: 'pointer' },
  miniNav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' },
  miniNavItem: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' },
  miniNavActive: { color: '#0061FF' },
  miniNavLink: { fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' },
  miniSidebarBottom: { marginTop: 'auto', marginBottom: '24px' },
  miniBottomBtn: { background: 'none', border: 'none', cursor: 'pointer', outline: 'none' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0F0F0F', borderTopLeftRadius: '32px', borderBottomLeftRadius: '32px', boxShadow: 'none', margin: '12px 0 12px 0px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  header: { height: '80px', padding: '0 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '14px', width: '400px', border: '1px solid rgba(255,255,255,0.05)' },
  searchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600', color: '#FFFFFF' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  uploadBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: '#0061FF', color: '#FFFFFF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' },
  opBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', borderRadius: '10px' },
  userSection: { position: 'relative' },
  userBadge: { width: '40px', height: '40px', backgroundColor: '#0061FF', color: '#FFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', cursor: 'pointer', overflow: 'hidden' },
  content: { flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' },
  
  // Popups & Flyouts
  flyoutOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  flyoutContent: { position: 'absolute', left: '120px', top: '12px', bottom: '12px', width: '360px', backgroundColor: '#141414', borderRadius: '24px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' },
  flyoutHeader: { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  flyoutTitle: { fontSize: '18px', fontWeight: '900', color: '#FFFFFF' },
  closeFlyout: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' },
  flyoutBody: { padding: '24px', flex: 1, overflowY: 'auto' },
  flyoutGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  flyoutItem: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#FFFFFF' },
  flyoutList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  flyoutListItem: { display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)', cursor: 'pointer', textAlign: 'left' },
  flyoutItemInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  flyoutItemName: { fontSize: '14px', fontWeight: '800', color: '#FFFFFF' },
  flyoutItemDesc: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  macProfilePopup: { position: 'absolute', top: '50px', right: 0, width: '320px', backgroundColor: '#1A1A1A', borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 10000, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  profileHeader: { padding: '24px' },
  profileInfoMain: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  userBadgeLarge: { width: '48px', height: '48px', backgroundColor: '#0061FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: '#FFF', overflow: 'hidden' },
  profileName: { fontSize: '15px', fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  storageSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  storageBarContainer: { height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  popupStorageFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
  popupStorageText: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  upgradeLink: { background: 'none', border: 'none', color: '#0061FF', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'none' },
  popupDivider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  deviceSection: { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' },
  deviceText: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  popupMenu: { padding: '8px' },
  popupItem: { padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: '#FFFFFF', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' },
  languageSection: { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // Dashboard Stats & Components
  loadingScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#0F0F0F' },
  aiBadge: { padding: '6px 12px', backgroundColor: 'rgba(0, 97, 255, 0.1)', color: '#0061FF', borderRadius: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', width: 'fit-content' },
  resultsContainer: { padding: '40px' },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
  resultCard: { backgroundColor: '#1A1A1A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' },
  resultIconBox: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resultType: { fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '4px', color: 'rgba(255,255,255,0.4)' },
  resultTitle: { fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginBottom: '4px' },
  resultDate: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  viewResultBtn: { padding: '10px 16px', backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1', borderRadius: '10px', fontSize: '12px', fontWeight: '800', color: '#64748B', cursor: 'pointer' },
  
  // LogDock Original Premium Styles
  dashboardView: { padding: '0px', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' },
  sectionTitle: { fontSize: '28px', fontWeight: '900', color: '#FFFFFF', marginBottom: '24px', letterSpacing: '-0.5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' },
  statCard: { padding: '32px', backgroundColor: '#1A1A1A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  statIconBox: { width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statTitle: { fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#FFFFFF' },
  dashboardMainGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' },
  dashboardPrimaryCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  insightsSection: { backgroundColor: '#1A1A1A', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' },
  insightList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  insightItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  fileCard: { backgroundColor: '#1A1A1A', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', alignItems: 'center', transition: 'all 0.2s ease', cursor: 'pointer' },
  fileIconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  fileName: { fontSize: '14px', fontWeight: '800', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  timelineSidebar: { backgroundColor: '#141414', padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', alignSelf: 'start', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  timelineList: { display: 'flex', flexDirection: 'column' },
  timelineItem: { display: 'flex', gap: '20px', paddingBottom: '32px', borderLeft: '2px solid rgba(255,255,255,0.05)', marginLeft: '6px', paddingLeft: '28px', position: 'relative' },
  timelineDot: { width: '14px', height: '14px', borderRadius: '50%', position: 'absolute', left: '-8px', top: '0', border: '3px solid #141414', boxShadow: 'none' },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  timelineUser: { fontSize: '12px', fontWeight: '900', color: '#FFFFFF' },
  timelineTime: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  timelineEvent: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '500', lineHeight: '1.4' },
  
  aiStatusBadge: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFF', padding: '10px 20px', borderRadius: '16px' },
  statusDotGreen: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF' },
  projectList: { display: 'flex', flexDirection: 'column', gap: '24px' },
  projectMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', color: '#0061FF' },
  projectTeam: { display: 'flex', alignItems: 'center', gap: '16px' },
  teamAvatars: { display: 'flex', marginLeft: '8px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F1F1', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#0061FF', marginLeft: '-8px' },
  inviteBtn: { backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '100px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  projectTabs: { display: 'flex', gap: '20px', borderTop: '1px solid #F1F1F1', paddingTop: '20px' },
  projectTab: { fontSize: '13px', fontWeight: '700', color: '#94A3B8', cursor: 'pointer' },
  projectTabActive: { fontSize: '13px', fontWeight: '800', color: '#0061FF' },
  notifWidgetList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  notifWidgetCard: { padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F1F1' },
  notifWidgetHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  notifType: { fontSize: '11px', fontWeight: '800', color: '#0061FF', textTransform: 'uppercase' },
  notifEventName: { fontSize: '15px', fontWeight: '800', marginBottom: '8px' },
  notifEventTime: { fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' },
  notifWidgetMessage: { padding: '20px', borderRadius: '24px', border: '1px solid #F1F1F1' },
  notifMsgText: { fontSize: '13px', color: '#64748B', margin: 0 },
  assignmentTag: { fontSize: '12px', color: '#94A3B8', fontWeight: '700' },
  assignmentTitle: { fontSize: '16px', fontWeight: '800', margin: '8px 0 24px 0', lineHeight: '1.4' },
  assignmentFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  priorityBadge: { padding: '4px 12px', backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '11px', fontWeight: '800', borderRadius: '100px' },
  assigneeAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#334155', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' },
  addAssignmentBtn: { width: '100%', padding: '16px', borderRadius: '16px', border: '2px dashed #F1F1F1', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', margin: '12px 0' },
  calDayHead: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textAlign: 'center' },
  calDay: { height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#334155', cursor: 'pointer', borderRadius: '50%' },
  calDayActive: { backgroundColor: '#0061FF', color: '#FFFFFF' },
  calendarEvents: { marginTop: '20px' },
  calEvent: { padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  calEventTime: { fontSize: '11px', fontWeight: '800', color: '#94A3B8' },
  calEventInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' },
  calEventDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  taskItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '20px', border: '1px solid #F1F1F1' },
  taskName: { fontSize: '15px', fontWeight: '800', margin: 0 },
  taskTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  taskProgress: { display: 'flex', alignItems: 'center', gap: '12px', width: '120px' },
  progressBar: { flex: 1, height: '6px', backgroundColor: '#F1F1F1', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0061FF' },
  progressText: { fontSize: '12px', fontWeight: '800', color: '#334155' },
  premiumWidget: { backgroundColor: '#0061FF', borderRadius: '32px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', color: '#FFFFFF' },
  premiumIcon: { width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { fontSize: '20px', fontWeight: '900', margin: 0 },
  premiumText: { fontSize: '13px', opacity: 0.8, lineHeight: '1.5', margin: 0 },
  premiumBtn: { backgroundColor: '#FFF', color: '#0061FF', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  statMiniCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid #F1F1F1', display: 'flex', alignItems: 'center', gap: '20px' },
  statRing: { width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #F1F1F1', borderTopColor: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statRingInner: { fontSize: '11px', fontWeight: '900' },
  meetingCard: { padding: '32px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid #F1F1F1', flex: 1 },
  meetingFooter: { marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  meetingTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '700' },
  meetingActions: { display: 'flex', gap: '8px' },
  rescheduleBtn: { background: '#F1F1F1', border: 'none', borderRadius: '100px', padding: '8px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', cursor: 'pointer' },
  acceptBtn: { background: '#0061FF', border: 'none', borderRadius: '100px', padding: '8px 16px', fontSize: '11px', fontWeight: '800', color: '#FFF', cursor: 'pointer' },
  dashboardInnerContent: { display: 'flex', flexDirection: 'column', gap: '0', minHeight: '100vh', paddingBottom: '100px', backgroundColor: '#FFFFFF' },
  scoreCard: { padding: '32px', backgroundColor: '#FFFFFF', borderRadius: '32px', border: '1px solid #F1F1F1', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease', boxShadow: 'none' },
  scoreHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  scoreLabel: { fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  scoreValue: { fontSize: '36px', fontWeight: '900', color: '#334155', letterSpacing: '-1px' },
  scoreBar: { height: '8px', backgroundColor: '#FFFFFF', borderRadius: '4px', overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: '4px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' },
  timelineContext: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#0061FF', backgroundColor: '#F0F7FF', padding: '6px 12px', borderRadius: '10px', width: 'fit-content' },
  viewAllTimelineBtn: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #F1F1F1', backgroundColor: '#FFFFFF', color: '#94A3B8', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px' },
  intelSidebar: { 
    position: 'fixed', 
    top: '12px', 
    right: '12px', 
    bottom: '12px', 
    width: '380px', 
    backgroundColor: '#1A1A1A', 
    borderRadius: '32px', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  intelHeader: { padding: '24px 32px', borderBottom: '1px solid #F1F1F1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  intelTitle: { fontSize: '15px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.5px' },
  intelContent: { padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' },
  intelAlert: { backgroundColor: 'rgba(124, 58, 237, 0.1)', padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#7C3AED', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(124, 58, 237, 0.2)' },
  intelFieldGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  intelLabel: { fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' },
  intelValue: { fontSize: '15px', fontWeight: '800', color: '#FFFFFF' },
  intelDataBox: { padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' },
  
  // Automations Styles
  automationsContainer: { padding: '48px', maxWidth: '1200px' },
  autoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' },
  autoCard: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #F1F1F1', boxShadow: 'none', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  autoHeader: { display: 'flex', gap: '20px', marginBottom: '32px' },
  autoIconBox: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  autoTitle: { fontSize: '16px', fontWeight: '900', color: '#334155', marginBottom: '4px' },
  autoDesc: { fontSize: '13px', color: '#64748B', fontWeight: '600', lineHeight: '1.5' },
  toggleSwitch: { width: '42px', height: '24px', borderRadius: '100px', padding: '3px', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0 },
  toggleDot: { width: '18px', height: '18px', backgroundColor: '#FFF', borderRadius: '50%', boxShadow: 'none', transition: 'all 0.3s ease' },
  autoFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #F1F1F1' },
  autoStatus: { fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' },
  autoSettingsBtn: { background: 'none', border: 'none', color: '#0061FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  
  synergyCard: { background: 'linear-gradient(135deg, #334155 0%, #334155 100%)', borderRadius: '32px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', boxShadow: 'none' },
  synergyHeader: { display: 'flex', gap: '20px' },
  synergyIcon: { width: '56px', height: '56px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  synergyStatus: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '700', color: '#0061FF', margin: '24px 0' },
  synergyBtn: { width: '100%', padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#FFF', color: '#334155', fontSize: '13px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' },

  // Team Styles
  teamContainer: { padding: '48px', maxWidth: '1000px' },
  teamHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  teamTitle: { fontSize: '28px', fontWeight: '900', color: '#334155', marginBottom: '8px' },
  teamSubtitle: { fontSize: '15px', color: '#64748B', fontWeight: '600' },
  addMemberBtn: { backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', padding: '12px 24px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'none' },
  memberList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  memberCard: { backgroundColor: '#FFF', borderRadius: '24px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F1F1', boxShadow: 'none' },
  memberInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  memberAvatar: { width: '48px', height: '48px', backgroundColor: '#FFFFFF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#0061FF', border: '1px solid #F1F1F1' },
  memberName: { fontSize: '15px', fontWeight: '800', color: '#334155' },
  memberEmail: { fontSize: '13px', color: '#94A3B8', fontWeight: '600' },
  memberMeta: { display: 'flex', alignItems: 'center', gap: '24px' },
  roleBadge: { fontSize: '11px', fontWeight: '900', padding: '6px 12px', borderRadius: '10px', letterSpacing: '0.5px' },
  memberActionBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px', borderRadius: '10px' },
  
  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 },
  inviteModal: { backgroundColor: '#FFF', width: '450px', borderRadius: '32px', boxShadow: 'none', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' },
  modalHeader: { padding: '24px 32px', borderBottom: '1px solid #F1F1F1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  modalBody: { padding: '32px' },
  inputLabel: { fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  modalInput: { padding: '16px', borderRadius: '16px', border: '1px solid #F1F1F1', outline: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  modalSelect: { padding: '16px', borderRadius: '16px', border: '1px solid #F1F1F1', outline: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: '#FFF' },
  inviteNotice: { fontSize: '12px', color: '#64748B', fontWeight: '500', lineHeight: '1.6', margin: '8px 0' },
  confirmInviteBtn: { backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', marginTop: '12px', boxShadow: 'none' },

  // API & Workflow Styles
  apiContainer: { padding: '48px', maxWidth: '1200px' },
  apiGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' },
  apiMainCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  apiSideCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  apiCard: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #F1F1F1', boxShadow: 'none' },
  apiCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  apiCardTitle: { fontSize: '15px', fontWeight: '900', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' },
  apiAddBtn: { backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '8px 16px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  keyList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  keyItem: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F1F1' },
  keyInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  keyName: { fontSize: '13px', fontWeight: '800', color: '#334155' },
  keyCode: { fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' },
  keyActionBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  webhookBox: { backgroundColor: '#F0F7FF', borderRadius: '24px', padding: '24px', border: '1px solid #F1F1F1' },
  webhookLabel: { fontSize: '10px', fontWeight: '900', color: '#0061FF', marginBottom: '8px' },
  webhookUrl: { backgroundColor: '#FFF', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: '#334155', boxShadow: 'none' },
  webhookHint: { fontSize: '12px', color: '#64748B', fontWeight: '500', marginTop: '16px', lineHeight: '1.5' },
  logList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: { padding: '16px', borderBottom: '1px solid #F1F1F1' },
  
  workflowContainer: { padding: '48px', maxWidth: '1000px' },
  workflowCanvas: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px', backgroundColor: '#FFFFFF', borderRadius: '40px', border: '1px dashed #F1F1F1' },
  workflowNode: { width: '400px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F1F1', boxShadow: 'none', overflow: 'hidden' },
  nodeHeader: { padding: '12px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F1F1', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' },
  nodeBody: { padding: '20px' },
  nodeLabel: { fontSize: '14px', color: '#475569', marginBottom: '4px' },
  nodeDetail: { fontSize: '12px', fontWeight: '800', color: '#334155' },
  workflowConnector: { width: '2px', height: '40px', backgroundColor: '#F1F1F1' },

  // AI Dashboard Styles
  aiDashboardContainer: { 
    flex: 1, 
    height: '100%', 
    background: 'linear-gradient(to bottom, #FFFFFF 0%, #E6EFFF 100%)', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '80px 40px',
    overflow: 'hidden',
    position: 'relative'
  },
  aiHeader: { textAlign: 'center', marginBottom: '60px', animation: 'fadeInDown 0.8s ease' },
  aiHeadline: { fontSize: '48px', fontWeight: '900', color: '#334155', marginBottom: '16px', letterSpacing: '-1px' },
  aiSubheadline: { fontSize: '18px', color: '#64748B', fontWeight: '600', maxWidth: '600px', margin: '0 auto' },
  
  aiChatContainer: { 
    width: '100%', 
    maxWidth: '800px', 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px',
    zIndex: 10
  },
  chatScroll: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px',
    scrollBehavior: 'smooth'
  },
  aiBubble: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFF', 
    padding: '20px 24px', 
    borderRadius: '24px 24px 24px 8px', 
    boxShadow: 'none', 
    border: '1px solid #F1F1F1',
    display: 'flex',
    gap: '16px',
    maxWidth: '80%',
    animation: 'slideUp 0.4s ease'
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#0061FF', 
    color: '#FFFFFF', 
    padding: '20px 24px', 
    borderRadius: '24px 24px 8px 24px', 
    boxShadow: 'none', 
    maxWidth: '70%',
    animation: 'slideUp 0.4s ease'
  },
  aiIconBox: { 
    width: '32px', 
    height: '32px', 
    backgroundColor: '#8B5CF6', 
    borderRadius: '10px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  msgContent: { fontSize: '15px', fontWeight: '600', lineHeight: '1.6' },
  typingDots: { fontSize: '20px', fontWeight: '900', color: '#8B5CF6' },
  
  aiInputWrapper: { 
    position: 'relative', 
    width: '100%', 
    marginTop: 'auto',
    animation: 'fadeInUp 0.8s ease'
  },
  aiInput: { 
    width: '100%', 
    padding: '24px 100px 24px 32px', 
    borderRadius: '100px', 
    border: '1px solid #F1F1F1', 
    backgroundColor: '#FFFFFF', 
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)', 
    outline: 'none', 
    fontSize: '16px', 
    fontWeight: '600', 
    transition: 'all 0.3s' 
  },
  aiSendBtn: { 
    position: 'absolute', 
    right: '12px', 
    top: '12px', 
    bottom: '12px', 
    width: '56px', 
    backgroundColor: '#0061FF', 
    border: 'none', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: 'none'
  },
  aiShortcuts: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' },
  aiShortcutBtn: { 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    border: '1px solid #F1F1F1', 
    padding: '8px 16px', 
    borderRadius: '100px', 
    fontSize: '12px', 
    fontWeight: '800', 
    color: '#64748B', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // Hybrid Dashboard Styles
  dashboardScrollWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#FFF' },
  aiHeroHero: { 
    padding: '60px 40px', 
    backgroundColor: '#F1F1F1', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    borderBottom: '1px solid #F1F1F1',
    marginBottom: '48px'
  },
  aiHeadlineSmall: { fontSize: '32px', fontWeight: '900', color: '#334155', marginBottom: '16px' },
  aiInputWrapperSmall: { position: 'relative', width: '100%', maxWidth: '600px' },
  aiInputSmall: { width: '100%', padding: '16px 60px 16px 24px', borderRadius: '100px', border: '1px solid #F1F1F1', backgroundColor: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', outline: 'none', fontSize: '14px', fontWeight: '600' },
  aiSendBtnSmall: { position: 'absolute', right: '8px', top: '8px', bottom: '8px', width: '40px', backgroundColor: '#0061FF', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  aiSmallHint: { background: 'none', border: 'none', color: '#0061FF', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' },
  offerToast: { position: 'fixed', bottom: '32px', left: '32px', backgroundColor: '#1A1A1A', borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 10000, animation: 'slideUp 0.5s ease', width: '400px' },
  offerTitle: { fontSize: '15px', fontWeight: '900', color: '#FFFFFF', marginBottom: '4px' },
  offerText: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  offerClose: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' },

  // Onboarding & Nudge Styles
  onboardingOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'none', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  onboardingCard: { backgroundColor: '#FFF', borderRadius: '40px', width: '100%', maxWidth: '640px', padding: '48px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
  onboardingHeader: { textAlign: 'center', marginBottom: '40px' },
  onboardingTitle: { fontSize: '24px', fontWeight: '900', color: '#334155', marginTop: '16px' },
  onboardingSubtitle: { fontSize: '12px', color: '#94A3B8', fontWeight: '800', marginTop: '4px' },
  onboardingGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' },
  onboardingOpt: { padding: '24px', borderRadius: '24px', border: '2px solid #F1F1F1', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
  onboardingIconBox: { width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  onboardingLabel: { fontSize: '13px', fontWeight: '700', color: '#334155' },
  onboardingFooter: { display: 'flex', justifyContent: 'center', gap: '16px' },
  onboardingBack: { background: 'none', border: 'none', color: '#94A3B8', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  onboardingNext: { backgroundColor: '#0061FF', color: '#FFF', border: 'none', padding: '14px 40px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' },
  
  nudgeStack: { position: 'fixed', bottom: '32px', right: '32px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999 },
  nudgeBox: { width: '320px', backgroundColor: '#FFF', borderRadius: '24px', padding: '20px', border: '1px solid #F1F1F1', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  nudgeIcon: { width: '32px', height: '32px', backgroundColor: '#8B5CF6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nudgeContent: { flex: 1 },
  nudgeType: { fontSize: '9px', fontWeight: '900', color: '#8B5CF6', letterSpacing: '1px', marginBottom: '4px' },
  nudgeText: { fontSize: '13px', fontWeight: '600', color: '#334155', lineHeight: '1.5' },
  nudgeClose: { background: 'none', border: 'none', color: '#F1F1F1', cursor: 'pointer', padding: '4px' },

  // New Dashboard Component Styles
  summaryGridSmall: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  statCardFixed: { padding: '32px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid #F1F1F1', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  statHeaderSmall: { display: 'flex', alignItems: 'center', gap: '12px' },
  statLabelSmall: { fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  statValueLarge: { fontSize: '36px', fontWeight: '900', color: '#334155', letterSpacing: '-1px' },
  statBarSmall: { height: '8px', backgroundColor: '#FFFFFF', borderRadius: '4px', overflow: 'hidden' },
  statBarFillSmall: { height: '100%', borderRadius: '4px' },
  
  timelineSidebarSmall: { backgroundColor: '#FFF', borderRadius: '40px', padding: '40px', border: '1px solid #F1F1F1', display: 'flex', flexDirection: 'column', gap: '32px', alignSelf: 'start', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
  timelineItemSmall: { display: 'flex', gap: '20px', paddingBottom: '32px', borderLeft: '2px solid #FFFFFF', marginLeft: '6px', paddingLeft: '28px', position: 'relative' },
  timelineDotSmall: { width: '14px', height: '14px', borderRadius: '50%', position: 'absolute', left: '-8px', top: '0', border: '3px solid #FFF', boxShadow: '0 0 0 4px #FFFFFF' },
  timelineContentSmall: { flex: 1 },
  timelineHeaderSmall: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' },
  timelineUserSmall: { fontSize: '12px', fontWeight: '900', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timelineTimeSmall: { fontSize: '11px', fontWeight: '700', color: '#F1F1F1' },
  timelineEventSmall: { fontSize: '14px', color: '#475569', marginBottom: '12px', fontWeight: '500', lineHeight: '1.5' },
  timelineContextSmall: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#0061FF', backgroundColor: '#F0F7FF', padding: '6px 12px', borderRadius: '10px', width: 'fit-content' },
  viewAllTimelineBtnSmall: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #F1F1F1', backgroundColor: '#F0F7FF', color: '#0061FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px' },
  
  dropdownItem: { width: '100%', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, transition: '0.2s' },
  menuDivider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0' },
  shortcutText: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 },

  // Widget & Dashboard component styles
  dashboardWidgetGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
  widgetCard: { backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' },
  widgetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  widgetTitle: { fontSize: '15px', fontWeight: '900', color: '#FFFFFF', margin: 0 },

  // Button styles used in IntelSidebar & header
  closeProgressBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  upgradeHeaderBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#0061FF', color: '#FFFFFF', fontSize: '13px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: 'none' },
  inviteHeaderBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'transparent', color: '#334155', fontSize: '13px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', border: '1px solid #F1F1F1' },
  badgeMini: { fontSize: '10px', fontWeight: '900', color: '#64748B', padding: '4px 10px', borderRadius: '8px', border: '1px solid #F1F1F1' },

  // File & content view styles
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: '16px', textAlign: 'center' as const },
  emptyShared: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px' },
  contentTitle: { fontSize: '22px', fontWeight: '900', color: '#334155', marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '900', color: '#334155', marginBottom: '8px' },
  fileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  fileRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F1F1F1', backgroundColor: '#FFFFFF', cursor: 'pointer' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemName: { fontSize: '14px', fontWeight: '700', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  itemMeta: { fontSize: '11px', color: '#94A3B8', fontWeight: '600' },
  itemCount: { fontSize: '12px', color: '#64748B', fontWeight: '600' },

  // Filter bar styles
  filterBtn: { background: 'none', border: '1px solid #F1F1F1', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', color: '#64748B', cursor: 'pointer', transition: '0.2s' },
  filterBtnActive: { backgroundColor: '#0061FF', border: '1px solid #0061FF', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer' },
  filterGroup: { display: 'flex', gap: '8px', alignItems: 'center' },
  filterDivider: { width: '1px', height: '20px', backgroundColor: '#F1F1F1' },

  // Photos view styles
  photosView: { padding: '32px', flex: 1, overflowY: 'auto' as const },
  photosFilterBar: { display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' },
  photosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' },
  mediaItem: { borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F1F1F1', cursor: 'pointer', position: 'relative' as const },
  mediaThumb: { width: '100%', aspectRatio: '1', objectFit: 'cover' as const, display: 'block' },
  videoThumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' as const, display: 'block' },

  // Month grouping styles
  monthSection: { marginBottom: '32px' },
  monthHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  monthTitle: { fontSize: '15px', fontWeight: '900', color: '#334155' },
  monthCheckbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0061FF' },

  // Shared folder styles
  sharedView: { padding: '32px', flex: 1, overflowY: 'auto' as const },
  sharedFilterBar: { display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' as const },
  sharedContent: { display: 'flex', flexDirection: 'column', gap: '24px' },

  // Stats bar styles
  statsRow: { display: 'flex', gap: '24px', marginBottom: '32px' },
  statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  statTrend: { fontSize: '11px', fontWeight: '700', color: '#10B981' },

  // Zoom control
  zoomControl: { display: 'flex', alignItems: 'center', gap: '8px' },
  zoomSlider: { width: '80px', accentColor: '#0061FF' },
};

interface LogDockFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  version: number;
  company_id: string;
  folder_id: string | null;
  created_at: string;
  deleted_at: string | null;
  category?: string;
  status?: string;
  is_public: boolean;
}

interface LogDockFolder {
  id: string;
  name: string;
  parent_id: string | null;
  company_id: string;
}

// --- Protected Route Guard ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div style={styles.loadingScreen}><RefreshCw className="animate-spin" size={32} color="#0061FF" /></div>;
  if (!user || !profile) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

// --- Components ---

const Globe = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
);

const PremiumFolderIcon = ({ width = 24, height = 18 }: { width?: number, height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="folderGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4DA3FF"/>
        <stop offset="100%" stopColor="#1E6BFF"/>
      </linearGradient>
      <linearGradient id="folderTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#66B2FF"/>
        <stop offset="100%" stopColor="#3D8BFF"/>
      </linearGradient>
    </defs>
    <rect x="2" y="10" width="60" height="34" rx="6" fill="url(#folderGradient)" />
    <path d="M4 10C4 8.5 6 6 8 6H22C24 6 25 7 26 8L28 10H60C62 10 62 30 62 14V16H2V12C2 10 3 10 4 10Z" fill="url(#folderTop)"/>
  </svg>
);

const ProfilePopup: React.FC<{ profile: any, storage: any, onClose: () => void, onUpgrade: () => void, onNavigate: (tab: string, data?: any) => void }> = ({ profile, storage, onClose, onUpgrade, onNavigate }) => {
  const { signOut } = useAuth();
  return (
    <div style={styles.macProfilePopup} onClick={e => e.stopPropagation()}>
      <div style={styles.profileHeader}>
        <div style={styles.profileInfoMain}>
          <div 
            style={{ ...styles.userBadgeLarge, position: 'relative', cursor: 'pointer', overflow: 'hidden', width: '80px', height: '80px', borderRadius: '24px', fontSize: '32px' }}
            onMouseEnter={e => {
              const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement;
              if (overlay) overlay.style.opacity = '1';
            }}
            onMouseLeave={e => {
              const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement;
              if (overlay) overlay.style.opacity = '0';
            }}
          >
            <label style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.full_name?.[0] || 'A'
              )}
              <div className="avatar-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <Camera size={18} color="#FFF" />
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFF', marginLeft: '4px' }}>Alterar</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onNavigate('upload_profile_photo', e.target.files[0]);
                  }
                }} 
              />
            </label>
          </div>
          <div>
            <div style={styles.profileName}>{profile?.full_name || 'Usuário'}</div>
            <div style={styles.profileEmail}>{profile?.email || 'email@exemplo.com'}</div>
          </div>
        </div>
        
        <div style={styles.storageSection}>
          <div style={styles.storageBarContainer}>
            <div style={{ ...styles.popupStorageFill, width: `${storage.percent}%`, backgroundColor: storage.percent > 90 ? '#EF4444' : '#0061FF' }} />
          </div>
          <div style={styles.popupStorageText}>
            <AlertTriangle size={14} color={storage.percent > 90 ? '#EF4444' : 'rgba(255,255,255,0.4)'} />
            <span>Usando {(storage.used / (1024 ** 3)).toFixed(2)} GB de {(storage.total / (1024 ** 3)).toFixed(0)} GB</span>
          </div>
          <button style={styles.upgradeLink} onClick={onUpgrade}>Fazer upgrade</button>
        </div>
      </div>

      <div style={styles.popupDivider} />

      <div style={styles.deviceSection}>
        <Laptop size={18} color="rgba(255,255,255,0.4)" />
        <span style={styles.deviceText}>1 dispositivo conectado</span>
      </div>

      <div style={styles.popupDivider} />

      <div style={styles.popupMenu}>
        {[
          { label: 'Configurações', tab: 'configuracoes' },
          { label: 'Gerenciar conta', tab: 'perfil' },
          { label: 'Automações', tab: 'automacoes' },
        ].map(item => (
          <div 
            key={item.tab} 
            style={styles.popupItem} 
            onClick={() => onNavigate(item.tab)}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {item.label}
          </div>
        ))}
        <div 
          style={styles.popupItem} 
          onClick={() => window.open('/download', '_blank')}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Instalar o aplicativo para desktop
          <ExternalLink size={14} />
        </div>
        <div 
          style={styles.popupItem}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Tema
          <ChevronRight size={14} />
        </div>
        <div 
          style={styles.popupItem} 
          onClick={signOut}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Sair
        </div>
      </div>

      <div style={styles.popupDivider} />

      <div style={styles.languageSection}>
        <Globe size={14} color="rgba(255,255,255,0.4)" />
        <span>Português (Brasil)</span>
      </div>
    </div>
  );
};

const OfferToast: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div style={styles.offerToast}>
      <div style={{ flex: 1 }}>
        <div style={styles.offerTitle}>30 dias grátis para você</div>
        <div style={styles.offerText}>Experimente algo novo! Não é necessário cartão agora.</div>
      </div>
      <button style={styles.offerClose} onClick={onClose}><X size={16} /></button>
    </div>
  );
};





const IntelSidebar: React.FC<{ file: LogDockFile, onClose: () => void }> = ({ file, onClose }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const context = file.ai_metadata?.context || 'Geral';
  
  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      toast.success('Dados confirmados com sucesso!', { icon: '✅' });
      onClose();
    }, 1000);
  };

  return (
    <div style={styles.intelSidebar}>
      <div style={styles.intelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#8B5CF6', padding: '8px', borderRadius: '10px' }}>
            <Zap size={16} color="#FFF" />
          </div>
          <span style={styles.intelTitle}>Inteligência LogDock</span>
        </div>
        <button style={styles.closeProgressBtn} onClick={onClose}><X size={16} /></button>
      </div>

      <div style={styles.intelContent}>
        <div style={styles.intelAlert}>
          <Info size={16} />
          <span>Documento classificado como <strong>{context}</strong></span>
        </div>

        <div style={styles.intelFieldGroup}>
          <span style={styles.intelLabel}>Entidade Detectada</span>
          <div style={styles.intelDataBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {context === 'VEHICLE' && <Truck size={18} color="#0061FF" />}
              {context === 'DRIVER' && <User size={18} color="#0061FF" />}
              {context === 'DELIVERY' && <Box size={18} color="#0061FF" />}
              <span style={styles.intelValue}>
                {context === 'VEHICLE' ? 'Scania R450 (ABC-1234)' : 
                 context === 'DRIVER' ? 'João da Silva (CNH 123...)' : 
                 context === 'DELIVERY' ? 'Pedido #8821' : 'Indefinido'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.intelFieldGroup}>
          <span style={styles.intelLabel}>Dados Extraídos (IA)</span>
          <div style={styles.intelDataBox}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Data de Emissão</span>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>12/04/2026</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Data de Vencimento</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#EF4444' }}>12/04/2027</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Confiança IA</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0061FF' }}>98.2%</span>
                </div>
             </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <button 
             style={{ ...styles.upgradeHeaderBtn, width: '100%', height: '48px', justifyContent: 'center', backgroundColor: '#0061FF', color: '#FFF', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' }}
             onClick={handleConfirm}
             disabled={isConfirming}
           >
             {isConfirming ? <RefreshCw className="animate-spin" size={16} /> : 'Confirmar e Vincular'}
           </button>
           <button style={{ ...styles.inviteHeaderBtn, width: '100%', height: '48px', justifyContent: 'center', backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #F1F1F1', padding: '12px', boxShadow: 'none' }}>
             Corrigir Manualmente
           </button>
        </div>
      </div>
    </div>
  );
};

const SummaryCards: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div style={styles.summaryGridSmall}>
       <div style={styles.statCardFixed}>
          <div style={styles.statHeaderSmall}><Activity size={18} color="#0061FF" /> <span style={styles.statLabelSmall}>Saúde da Frota</span></div>
          <div style={styles.statValueLarge}>98%</div>
          <div style={styles.statBarSmall}><div style={{...styles.statBarFillSmall, width: '98%', backgroundColor: '#0061FF'}} /></div>
       </div>
       <div style={styles.statCardFixed}>
          <div style={styles.statHeaderSmall}><ShieldCheck size={18} color="#0061FF" /> <span style={styles.statLabelSmall}>Conformidade</span></div>
          <div style={styles.statValueLarge}>85%</div>
          <div style={styles.statBarSmall}><div style={{...styles.statBarFillSmall, width: '85%', backgroundColor: '#0061FF'}} /></div>
       </div>
       <div style={styles.statCardFixed}>
          <div style={styles.statHeaderSmall}><Zap size={18} color="#8B5CF6" /> <span style={styles.statLabelSmall}>Predição de Falhas</span></div>
          <div style={styles.statValueLarge}>BAIXO</div>
          <div style={styles.statBarSmall}><div style={{...styles.statBarFillSmall, width: '12%', backgroundColor: '#8B5CF6'}} /></div>
       </div>
       <div style={styles.statCardFixed}>
          <div style={styles.statHeaderSmall}><AlertTriangle size={18} color="#EF4444" /> <span style={styles.statLabelSmall}>Alertas Críticos</span></div>
          <div style={{ ...styles.statValueLarge, color: '#EF4444' }}>3</div>
          <div style={styles.statBarSmall}><div style={{...styles.statBarFillSmall, width: '40%', backgroundColor: '#EF4444'}} /></div>
       </div>
    </div>
  );
};

const TimelineView: React.FC<{ events: any[] }> = ({ events }) => {
  return (
    <div style={styles.timelineSidebarSmall}>
      <div style={styles.widgetHeader}>
        <h3 style={styles.widgetTitle}>Linha do Tempo</h3>
        <Clock size={16} color="#94A3B8" />
      </div>
      <div style={styles.timelineList}>
        {events.map((item, idx) => (
          <div key={idx} style={styles.timelineItemSmall}>
            <div style={{ ...styles.timelineDotSmall, backgroundColor: item.event_type === 'IA' ? '#8B5CF6' : '#0061FF' }} />
            <div style={styles.timelineContentSmall}>
              <div style={styles.timelineHeaderSmall}>
                <span style={styles.timelineUserSmall}>{item?.event_type || 'INFO'}</span>
                <span style={styles.timelineTimeSmall}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={styles.timelineEventSmall}>{item?.details}</div>
              <div style={styles.timelineContextSmall}>
                <Zap size={14} />
                <span>{item?.entity_type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button style={styles.viewAllTimelineBtnSmall}>Ver Histórico Completo</button>
    </div>
  );
};

const OnboardingModal: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<string[]>([]);

  const toggleSelection = (item: string) => {
    setSelections(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const steps = [
    { 
      title: 'Como você quer usar o LogDock?', 
      options: [
        { id: 'drive', label: 'Apenas armazenar arquivos', icon: <FileText /> },
        { id: 'entregas', label: 'Gerenciar entregas', icon: <Truck /> },
        { id: 'frota', label: 'Controlar frota', icon: <Box /> },
        { id: 'all', label: 'Completo (Auto-adaptativo)', icon: <Zap /> }
      ]
    },
    {
      title: 'Você já usa algum sistema?',
      options: [
        { id: 'api', label: 'Sim, vou integrar via API', icon: <RefreshCw /> },
        { id: 'manual', label: 'Não, quero usar manual', icon: <Plus /> }
      ]
    }
  ];

  const currentStepData = steps[step - 1];

  return (
    <div style={styles.onboardingOverlay}>
      <div style={styles.onboardingCard}>
        <div style={styles.onboardingHeader}>
           <div style={styles.aiBadge}>ONBOARDING INTELIGENTE</div>
           <h2 style={styles.onboardingTitle}>{currentStepData.title}</h2>
           <p style={styles.onboardingSubtitle}>Passo {step} de {steps.length}</p>
        </div>

        <div style={styles.onboardingGrid}>
           {currentStepData.options.map(opt => (
             <div 
               key={opt.id} 
               style={{ ...styles.onboardingOpt, borderColor: selections.includes(opt.id) ? '#0061FF' : '#F1F1F1', backgroundColor: selections.includes(opt.id) ? '#F0F7FF' : '#FFF' }}
               onClick={() => toggleSelection(opt.id)}
             >
               <div style={{ ...styles.onboardingIconBox, color: selections.includes(opt.id) ? '#0061FF' : '#64748B' }}>{opt.icon}</div>
               <span style={styles.onboardingLabel}>{opt.label}</span>
             </div>
           ))}
        </div>

        <div style={styles.onboardingFooter}>
           {step > 1 && <button style={styles.onboardingBack} onClick={() => setStep(step - 1)}>Voltar</button>}
           <button 
             style={styles.onboardingNext} 
             onClick={() => step === steps.length ? onComplete(selections) : setStep(step + 1)}
           >
             {step === steps.length ? 'Finalizar' : 'Próximo'}
           </button>
        </div>
      </div>
    </div>
  );
};

const SmartNudge: React.FC<{ type: string, message: string, onDismiss: () => void }> = ({ type, message, onDismiss }) => {
  return (
    <div style={styles.nudgeBox}>
       <div style={styles.nudgeIcon}><Zap size={16} color="#FFF" /></div>
       <div style={styles.nudgeContent}>
          <div style={styles.nudgeType}>DICA INTELIGENTE</div>
          <div style={styles.nudgeText}>{message}</div>
       </div>
       <button style={styles.nudgeClose} onClick={onDismiss}><X size={14} /></button>
    </div>
  );
};
const ResultsMemoryPage: React.FC = () => {
  const [results] = useState([
    { id: '1', type: 'RELATÓRIO', title: 'Análise de Atrasos - Região Sudeste', date: 'Hoje, 11:50', icon: <FileText size={18} color="#0061FF" /> },
    { id: '2', type: 'CONFORMIDADE', title: 'Validação de CNHs - Frota de Grãos', date: 'Ontem, 18:22', icon: <ShieldCheck size={18} color="#0061FF" /> },
    { id: '3', type: 'PREDIÇÃO', title: 'Manutenção Preditiva: Scania ABC-1234', date: '2 horas atrás', icon: <Zap size={18} color="#F59E0B" /> },
    { id: '4', type: 'AUDITORIA', title: 'Divergência em Comprovante #8821', date: 'Ontem, 09:15', icon: <AlertTriangle size={18} color="#EF4444" /> },
  ]);

  return (
    <div style={styles.resultsContainer}>
      <div style={{ marginBottom: '40px' }}>
        <div style={styles.aiBadge}>SISTEMA DE MEMÓRIA</div>
        <h2 style={styles.teamTitle}>Memória de Resultados</h2>
        <p style={styles.teamSubtitle}>Histórico de todas as análises, extrações e decisões geradas pela Inteligência LogDock.</p>
      </div>

      <div style={styles.resultsGrid}>
        {results.map(res => (
          <div key={res.id} style={styles.resultCard}>
            <div style={styles.resultIconBox}>{res.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...styles.resultType, color: (res.icon.props as any).color }}>{res.type}</div>
              <div style={styles.resultTitle}>{res.title}</div>
              <div style={styles.resultDate}>{res.date}</div>
            </div>
            <button style={styles.viewResultBtn}>Visualizar Relatório</button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DashboardProps {
  stats: any;
  events: any[];
  setActiveTab: (tab: string) => void;
  files: any[];
  folders: any[];
  carouselRef: React.RefObject<HTMLDivElement>;
  isDraggingCarousel: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseLeaveCarousel: () => void;
  handleMouseUp: () => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  
  recentFilesRef: React.RefObject<HTMLDivElement>;
  isDraggingRecent: boolean;
  handleMouseDownRecent: (e: React.MouseEvent) => void;
  handleMouseLeaveRecent: () => void;
  handleMouseUpRecent: () => void;
  handleMouseMoveRecent: (e: React.MouseEvent) => void;
  openActionSidebar: (context: any) => void;
  styles: Record<string, React.CSSProperties>;
  theme: 'light' | 'dark';
}

const DashboardView: React.FC<DashboardProps> = ({ 
  setActiveTab, files, folders, carouselRef, isDraggingCarousel, 
  handleMouseDown, handleMouseLeaveCarousel, handleMouseUp, handleMouseMove,
  recentFilesRef, isDraggingRecent, handleMouseDownRecent, handleMouseLeaveRecent, 
  handleMouseUpRecent, handleMouseMoveRecent, openActionSidebar, styles, theme
}) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string | null>('Project Details.xls');
  const [filterTab, setFilterTab] = useState<string>('recent');

  // TYPING EFFECT FOR HERO SLOGAN
  const fullText = "Simples Inteligente e Seguro";
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const filesList = [
    { name: 'Project Brief.docx', owner: 'Shared', ownerImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=60', dateUploaded: 'Sep 26, 2025', lastModified: 'Sep 28, 2025', size: '5 MB', type: 'doc' },
    { name: 'Project Details.xls', owner: 'Shared', ownerImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=60', dateUploaded: 'Sep 27, 2025', lastModified: 'Sep 27, 2025', size: '1.2 MB', type: 'excel' },
    { name: 'Cloud Dashboard.fig', owner: 'Restricted', ownerImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=60', dateUploaded: 'Sep 27, 2025', lastModified: 'Sep 28, 2025', size: '1 GB', type: 'figma' },
    { name: 'Design Notes.docx', owner: 'Shared', ownerImg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&auto=format&fit=crop&q=60', dateUploaded: 'Sep 27, 2025', lastModified: 'Sep 28, 2025', size: '20 MB', type: 'doc' }
  ];

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '0 32px', backgroundColor: 'transparent' }}>
      
      {/* 🤖 HERO AI ASSISTANT SECTION (DARK VERSION) */}
      <div style={{ padding: '40px 0 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent', borderRadius: '32px', marginBottom: '80px', position: 'relative' }}>
        
        {/* IA BADGE SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          {/* THE "BUTTON" */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', backgroundColor: '#0061FF', border: '1px solid #0061FF', 
            borderRadius: '100px', cursor: 'pointer',
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0, 97, 255, 0.2)'
          }}>
            <Sparkles size={14} color="#FFFFFF" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px' }}>
              logDock IA
            </span>
          </div>

          {/* THE DESCRIPTION (OUTSIDE) */}
          <span style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B', marginLeft: '16px' }}>
            Assistente Inteligente treinada para o ecossistema Logta
          </span>
        </div>

        <h1 style={{ fontSize: '56px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', marginBottom: '16px', letterSpacing: '-2px', lineHeight: '1.1', minHeight: '62px' }}>
          {displayText}
          <span style={{ 
            display: 'inline-block', width: '3px', height: '48px', 
            backgroundColor: '#0061FF', marginLeft: '8px',
            animation: 'blink 1s step-end infinite',
            verticalAlign: 'middle'
          }} />
          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </h1>
        <p style={{ fontSize: '15px', color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B', maxWidth: '600px', textAlign: 'center', lineHeight: '1.6', marginBottom: '40px', fontWeight: 500 }}>
          A inteligência que move sua operação logística.
        </p>



        {/* MAIN INPUT BOX */}
        <div style={{ width: '100%', maxWidth: '720px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <textarea
              placeholder="O que deseja procurar?"
              style={{ 
                flex: 1, background: 'transparent', border: 'none', outline: 'none', 
                color: theme === 'dark' ? '#FFFFFF' : '#334155', fontSize: '15px', fontWeight: 500, minHeight: '40px', 
                resize: 'none', padding: 0, fontFamily: "'Inter', system-ui, sans-serif",
                lineHeight: '1.5'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ background: '#FFFFFF', border: '1px solid #F1F1F1', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                <Plus size={16} color="#64748B" />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <Mic size={16} />
              </button>
              <button style={{ backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* SMART SUGGESTIONS */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Criar nova pasta', 'Enviar arquivos', 'Ver relatórios', 'Buscar motorista', 'Carga pendente'].map((text, i, arr) => (
            <React.Fragment key={text}>
              <span 
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, cursor: 'pointer', transition: '0.2s', letterSpacing: '0.3px' }} 
                onMouseEnter={e => { e.currentTarget.style.color = '#0061FF'; }} 
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
              >
                {text}
              </span>
              {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 📏 SEPARATOR LINE */}
      <div style={{ height: '1px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9', margin: '20px 0 48px 0', width: '100%' }} />

      {/* 🧱 TOP RECENT EDITED SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#334155', margin: 0, letterSpacing: '-0.5px' }}>Editados recentemente</h2>
        <button 
          onClick={() => setActiveTab('arquivos')}
          style={{ backgroundColor: 'transparent', border: 'none', color: '#0061FF', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <span>Ver tudo</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div 
        ref={recentFilesRef}
        onMouseDown={handleMouseDownRecent}
        onMouseLeave={handleMouseLeaveRecent}
        onMouseUp={handleMouseUpRecent}
        onMouseMove={handleMouseMoveRecent}
        style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '64px', 
          padding: '32px 0',
          overflowX: 'auto',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          scrollSnapType: isDraggingRecent ? 'none' : 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          cursor: isDraggingRecent ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >

        {(files.length > 0 ? files : [
          { name: 'Contrato Logística.pdf', type: 'doc', important: true },
          { name: 'Relatório Financeiro.xls', type: 'excel' },
          { name: 'Notas Fiscais Outubro.zip', type: 'archive' },
          { name: 'Comprovantes SP.pdf', type: 'doc' },
          { name: 'Manifesto de Carga.pdf', type: 'doc' },
          { name: 'Tabela de Fretes.xls', type: 'excel' },
        ]).map((item, idx) => (
          <div key={idx} 
            onClick={() => { if (!isDraggingRecent) setActiveTab('arquivos'); }}
            style={{ 
              minWidth: '280px', 
              padding: '24px', 
              backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', 
              border: item.important ? '1px solid #0061FF' : (theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #EBEBEB'), 
              borderRadius: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease', 
              boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.02)',
              scrollSnapAlign: 'start',
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0061FF'; e.currentTarget.style.backgroundColor = theme === 'dark' ? '#222222' : '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = item.important ? '#0061FF' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#EBEBEB'); e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1A1A1A' : '#FFFFFF'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'doc' ? <FileText size={24} color="#4285F4" /> :
                 item.type === 'excel' ? <FileText size={24} color="#34A853" /> :
                 <Files size={24} color="#64748B" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Conectado à</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0061FF', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '6px' }}>Carga #2024-X</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', marginBottom: '6px' }}>{item.name || (item as any).title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>Alterado há 2h</span>
                {item.important && <span style={{ fontSize: '10px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 900 }}>AÇÃO REQUERIDA</span>}
              </div>
              
              <button 
                onClick={() => {
                  if (!isDraggingRecent) {
                    openActionSidebar({ 
                      type: item.important ? 'VALIDATE' : 'VIEW', 
                      title: item.important ? 'Validar Documento' : 'Detalhes do Arquivo', 
                      operation: 'Carga #2024-X',
                      fileName: item.name || (item as any).title
                    });
                  }
                }}
                style={{ width: '100%', padding: '10px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F1F1', borderRadius: '12px', background: theme === 'dark' ? '#111' : '#FFF', fontSize: '12px', fontWeight: 800, color: theme === 'dark' ? '#94A3B8' : '#334155', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF'}
              >
                {item.important ? 'Validar Documento' : 'Visualizar Detalhes'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🧱 PASTAS COMPARTILHADAS (LAYERED FOLDERS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#334155', margin: 0, letterSpacing: '-0.5px' }}>Pastas Compartilhadas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ border: 'none', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#334155', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F1F1', fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <List size={14} />
            <span>Mais novas</span>
          </button>
          <button 
            onClick={() => setActiveTab('arquivos')}
            style={{ backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span>Ver tudo</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div 
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveCarousel}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ 
          display: 'flex', 
          gap: '24px', 
          marginBottom: '80px', 
          overflowX: 'auto', 
          paddingBottom: '24px',
          paddingTop: '10px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          scrollSnapType: isDraggingCarousel ? 'none' : 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          cursor: isDraggingCarousel ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {[
          { name: 'Dashboard Designs', meta: '62 files, 2.6 GB', active: true },
          { name: 'Figma Files', meta: '202 files, 2.6 GB', active: false },
          { name: 'Project Documents', meta: '12 files, 502 MB', active: false },
          { name: 'KDS Dashboard', meta: '12 Sketch files, 52.4 MB', active: false },
          { name: 'Mobile App - UI', meta: '102 files, 3.2 GB', active: false },
          { name: 'Finance Assets', meta: '45 files, 1.1 GB', active: false },
        ].map((folder, idx) => (
          <div key={idx} 
            onClick={() => setActiveTab('arquivos')}
            style={{ position: 'relative', height: '210px', minWidth: '280px', cursor: 'pointer', scrollSnapAlign: 'start', marginTop: '20px' }}
          >
            {/* macOS Style Folder Tab (Sloped) */}
            <div style={{
              position: 'absolute', top: '0px', left: '0px', width: '110px', height: '32px',
              background: folder.active ? '#0061FF' : 'rgba(255,255,255,0.05)',
              zIndex: 1,
              clipPath: 'polygon(0% 100%, 12% 0%, 88% 0%, 100% 100%)',
              transition: 'all 0.3s ease'
            }}></div>
            
            {/* Folder Body */}
            <div style={{
              position: 'absolute', top: '24px', left: 0, right: 0, bottom: 0,
              background: folder.active ? 'linear-gradient(145deg, #0070FF 0%, #0050D1 100%)' : '#1A1A1A',
              border: folder.active ? 'none' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '0 20px 20px 20px', padding: '24px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: folder.active ? '0 20px 40px rgba(0, 97, 255, 0.2)' : '0 4px 12px rgba(0,0,0,0.02)', 
              zIndex: 3, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.transform = 'translateY(-6px)'; 
              e.currentTarget.style.boxShadow = folder.active ? '0 25px 50px rgba(0, 97, 255, 0.3)' : '0 20px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = folder.active ? '0 20px 40px rgba(0, 97, 255, 0.2)' : '0 4px 12px rgba(0,0,0,0.02)';
            }}
            >
              <div>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: folder.active ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Folder size={24} color={folder.active ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} fill={folder.active ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} fillOpacity={0.2} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 900, color: folder.active ? '#FFFFFF' : (theme === 'dark' ? '#FFFFFF' : '#334155'), margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>{folder.name}</h4>
                <p style={{ fontSize: '12px', color: folder.active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontWeight: 700, margin: 0 }}>{folder.meta}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src="https://i.pravatar.cc/100?u=1" alt="A" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #1A1A1A', marginRight: '-10px', objectFit: 'cover' }} />
                  <img src="https://i.pravatar.cc/100?u=2" alt="B" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #1A1A1A', marginRight: '-10px', objectFit: 'cover' }} />
                  <img src="https://i.pravatar.cc/100?u=3" alt="C" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #1A1A1A', objectFit: 'cover' }} />
                  {idx === 1 && (
                    <span style={{ fontSize: '11px', backgroundColor: folder.active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: '#FFF', padding: '4px 10px', borderRadius: '10px', fontWeight: 900, marginLeft: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>+12</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🧱 RECENTLY OPENED SECTION (TABLE WITH ACTIONS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#EBEBEB', padding: '4px', borderRadius: '12px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #D1D1D1' }}>
          {[
            { id: 'recent', label: 'Abertos recentemente' },
            { id: 'shared-doc', label: 'Documentos compartilhados' },
            { id: 'shared-fold', label: 'Pastas compartilhadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                border: 'none', backgroundColor: filterTab === tab.id ? '#FFFFFF' : 'transparent',
                color: filterTab === tab.id ? '#000000' : 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 700,
                padding: '6px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {tab.id === 'recent' && <CheckCircle2 size={14} color="#0061FF" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color={theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B'} style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              style={{ padding: '8px 40px 8px 36px', borderRadius: '12px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F1F1', color: theme === 'dark' ? '#FFFFFF' : '#334155', fontSize: '13px', width: '200px', outline: 'none' }}
            />
            <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#94A3B8', fontWeight: 600 }}>⌘ F</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button style={{ border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button style={{ border: 'none', backgroundColor: '#FFFFFF', color: '#000000', padding: '6px', borderRadius: '8px', cursor: 'pointer', boxShadow: 'none' }}><List size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', borderRadius: '16px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F1F1', overflow: 'hidden', marginBottom: '24px', boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '12px 16px', width: '32px' }}>
                <input type="checkbox" style={{ borderRadius: '4px' }} checked={true} readOnly />
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>NOME DO ARQUIVO</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>RESPONSÁVEL</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>DATA DE ENVIO</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ÚLTIMA ALTERAÇÃO</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>TAMANHO</th>
              <th style={{ padding: '12px 16px', width: '32px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filesList.map((file, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedFile(file.name)}
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: selectedFile === file.name ? 'rgba(255,255,255,0.03)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <input type="checkbox" checked={selectedFile === file.name} readOnly style={{ accentColor: '#0061FF' }} />
                </td>
                <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={file.type === 'doc' ? "https://img.icons8.com/color/48/microsoft-word-2019.png" : file.type === 'excel' ? "https://img.icons8.com/color/48/microsoft-excel-2019.png" : "https://img.icons8.com/color/48/figma--v1.png"} 
                    alt="file type" 
                    style={{ width: '28px', height: '28px' }} 
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#FFFFFF' : '#334155' }}>{file.name}</span>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Shared <UsersIcon size={10} style={{ verticalAlign: 'middle' }} /></div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={file.ownerImg} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    {i === 0 && <span style={{ fontSize: '11px', backgroundColor: '#EDE9FE', color: '#0061FF', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>+12</span>}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{file.dateUploaded}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{file.lastModified}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{file.size}</td>
                <td style={{ padding: '14px 16px' }}>
                  <MoreHorizontal size={16} color="rgba(255,255,255,0.2)" style={{ cursor: 'pointer' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🧱 FOOTER POPUP FOR SELECTED FILE */}
      {selectedFile && (
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px',
          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', 
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1', 
          borderRadius: '16px', boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
          position: 'sticky', bottom: '16px', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="https://img.icons8.com/color/48/figma--v1.png" alt="Figma icon" style={{ width: '24px', height: '24px' }} />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{selectedFile}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '12px' }}>• 1.5 GB • Sep 28, 2025</span>
            </div>
            <span style={{ backgroundColor: '#1E1B4B', color: '#FFFFFF', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} color="#FFF" />
              <span>Restricted</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }} title="Download"><Download size={16} /></button>
            <button style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }} title="Copy Link"><LinkIcon size={16} /></button>
            <button style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
            <button style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }} title="Upload"><Upload size={16} /></button>
            <button style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }} title="More"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      )}

    </div>
  );
};


const OperationalMemoryView: React.FC<DashboardProps> = ({ stats, events, styles, theme }) => {
  return (
    <div style={styles.dashboardScrollWrapper}>
      <div style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#334155', marginBottom: '8px' }}>Memória Operacional</h1>
            <p style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B', fontWeight: '600' }}>Hub de Inteligência • {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={styles.aiStatusBadge}>
            <div style={styles.statusDotGreen} />
            <span>IA Ativa: Sincronização em Tempo Real</span>
          </div>
        </div>
        
        <SummaryCards stats={stats} />
        
        <div style={styles.dashboardMainGrid}>
          <div style={styles.dashboardPrimaryCol}>
            <div style={styles.dashboardWidgetGrid}>
              <div style={{ ...styles.widgetCard, gridColumn: 'span 2', background: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F1F1', padding: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck size={24} color="#0061FF" />
                       </div>
                       <div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#1E293B' }}>Ambiente Blindado</div>
                          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Criptografia AES-256 & Proteção SOC 2 Ativa</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div style={{ ...styles.widgetCard, gridColumn: 'span 2', backgroundColor: theme === 'dark' ? '#1E1B4B' : '#F0F9FF', borderColor: theme === 'dark' ? '#312E81' : '#BAE6FD' }}>
                <div style={styles.widgetHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#0061FF', padding: '10px', borderRadius: '12px' }}>
                      <Zap size={20} color="#FFF" />
                    </div>
                    <h3 style={styles.widgetTitle}>IA Preditiva: Próximas Ações</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  {[
                    { title: 'Manutenção Sugerida', desc: 'Placa ABC-1234 (Scania)', action: 'Agendar agora', color: '#0061FF' },
                    { title: 'Documento Expirando', desc: 'CNH Alison (em 15 dias)', action: 'Renovar', color: '#F59E0B' },
                    { title: 'Risco de Falha', desc: 'Volvo R500 (Freios)', action: 'Revisar', color: '#EF4444' },
                  ].map((task, i) => (
                    <div key={i} style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111' : '#FFF', padding: '20px', borderRadius: '20px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F1F1' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: task.color, textTransform: 'uppercase', marginBottom: '8px' }}>{task.title}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: theme === 'dark' ? '#FFFFFF' : '#334155', marginBottom: '12px' }}>{task.desc}</div>
                      <button style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1', borderRadius: '10px', padding: '8px 12px', fontSize: '11px', fontWeight: '800', color: theme === 'dark' ? '#94A3B8' : '#64748B', cursor: 'pointer' }}>{task.action}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.timelineSidebar}>
            <div style={styles.widgetHeader}>
              <h3 style={styles.widgetTitle}>Linha do Tempo</h3>
              <Clock size={16} color="#94A3B8" />
            </div>
            <div style={styles.timelineList}>
              {events.map((item, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={{ ...styles.timelineDot, backgroundColor: item.event_type === 'IA' ? '#8B5CF6' : '#0061FF' }} />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineUser}>{item?.event_type || 'INFO'}</span>
                      <span style={styles.timelineTime}>{item?.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    <div style={styles.timelineEvent}>{item?.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamPage: React.FC<{ styles: Record<string, React.CSSProperties> }> = ({ styles }) => {
  const [members, setMembers] = useState([
    { id: '1', name: 'Alison Thiago', email: 'alison@logdock.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: '2', name: 'Marcos Transportes', email: 'marcos@transp.com', role: 'OPERADOR', status: 'ACTIVE' },
    { id: '3', name: 'Convite Pendente', email: 'ana.contabil@gmail.com', role: 'VIEWER', status: 'INVITED' },
  ]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div style={styles.teamContainer}>
      <div style={styles.teamHeader}>
        <div>
          <h2 style={styles.teamTitle}>Equipe & Colaboradores</h2>
          <p style={styles.teamSubtitle}>Gerencie quem pode acessar e operar o drive desta transportadora.</p>
        </div>
        <button style={{ ...styles.addMemberBtn, backgroundColor: '#000', color: '#FFF', boxShadow: 'none' }} onClick={() => setIsInviteOpen(true)}>
          <UserPlus size={16} /> Convidar Colaborador
        </button>
      </div>

      <div style={styles.memberList}>
        {members.map(member => (
          <div key={member.id} style={styles.memberCard}>
            <div style={styles.memberInfo}>
              <div style={styles.memberAvatar}>{member.name[0]}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={styles.memberName}>{member.name}</div>
                <div style={styles.memberEmail}>{member.email}</div>
              </div>
            </div>
            <div style={styles.memberMeta}>
              <span style={{ ...styles.roleBadge, backgroundColor: member.role === 'ADMIN' ? '#EEF2FF' : '#FFFFFF', color: member.role === 'ADMIN' ? '#4338CA' : '#64748B' }}>
                {member.role}
              </span>
              <span style={{ ...styles.statusBadge, color: member.status === 'ACTIVE' ? '#0061FF' : '#F59E0B' }}>
                {member.status === 'ACTIVE' ? 'Ativo' : 'Convite Enviado'}
              </span>
              <button style={styles.memberActionBtn}><MoreHorizontal size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isInviteOpen && (
        <InviteModal onClose={() => setIsInviteOpen(false)} />
      )}
    </div>
  );
};

const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');

  const handleInvite = () => {
    if (!email) return toast.error('Por favor, insira um e-mail.');
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Enviando convite...',
        success: 'Convite enviado com sucesso!',
        error: 'Erro ao enviar convite.',
      }
    );
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          backgroundColor: '#FFFFFF', borderRadius: '32px',
          border: '1px solid #F1F1F1', padding: '40px',
          display: 'flex', flexDirection: 'column', gap: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
              Convidar Equipe
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Adicione colaboradores ao seu ecossistema.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              width: '36px', height: '36px', borderRadius: '12px', 
              backgroundColor: '#F8FAFC', border: 'none', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: '#64748B' 
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SOCIAL INVITE / LINKING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            style={{ 
              width: '100%', padding: '14px', borderRadius: '16px', 
              backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              fontSize: '14px', fontWeight: 800, color: '#1E293B', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            <img src="https://img.icons8.com/color/48/google-logo.png" style={{ width: '20px' }} alt="" />
            Vincular com Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#F1F1F1' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>ou por e-mail</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#F1F1F1' }} />
          </div>
        </div>

        {/* FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>E-mail do Colaborador</label>
            <input 
              type="email" 
              placeholder="exemplo@empresa.com"
              style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', outline: 'none', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Nível de Acesso</label>
            <select 
              style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', outline: 'none', fontSize: '14px', fontWeight: 700, color: '#1E293B', backgroundColor: '#FFF' }}
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="ADMIN">Administrador (Controle Total)</option>
              <option value="EDITOR">Editor (Edição e Upload)</option>
              <option value="VIEWER">Visualizador (Apenas Leitura)</option>
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '16px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: 'none', fontSize: '14px', fontWeight: 900, color: '#64748B', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleInvite}
            style={{ flex: 1, padding: '16px', borderRadius: '16px', backgroundColor: '#0061FF', border: 'none', fontSize: '14px', fontWeight: 900, color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' }}
          >
            Enviar Convite
          </button>
        </div>
      </div>
    </div>
  );
};

const UserAPIs: React.FC<{ styles: Record<string, React.CSSProperties> }> = ({ styles }) => {
  const [keys, setKeys] = useState([{ id: '1', name: 'ERP Logística Principal', key: 'ld_live_a1b2c3d4e5f6...', created: '2026-05-01' }]);
  const [logs] = useState([
    { id: '1', method: 'POST', endpoint: '/v1/incoming', status: 200, time: '10:45:22', payload: 'file: nota_fiscal.pdf' },
    { id: '2', method: 'POST', endpoint: '/v1/incoming', status: 200, time: '10:46:01', payload: 'delivery: #8842' },
  ]);

  return (
    <div style={styles.apiContainer}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#334155', marginBottom: '8px' }}>API & Integrações</h2>
        <p style={{ color: '#64748B', fontWeight: '600' }}>Conecte seu ERP ou sistemas externos para automatizar o LogDock.</p>
      </div>

      <div style={styles.apiGrid}>
        <div style={styles.apiMainCol}>
          <div style={styles.apiCard}>
            <div style={styles.apiCardHeader}>
              <h3 style={styles.apiCardTitle}>Minhas Chaves de API</h3>
              <button style={styles.apiAddBtn}><Plus size={16} /> Gerar Nova Chave</button>
            </div>
            <div style={styles.keyList}>
              {keys.map(k => (
                <div key={k.id} style={styles.keyItem}>
                  <div style={styles.keyInfo}>
                    <span style={styles.keyName}>{k.name}</span>
                    <code style={styles.keyCode}>{k.key}</code>
                  </div>
                  <button style={styles.keyActionBtn}><Copy size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.apiCard}>
            <div style={styles.apiCardHeader}>
              <h3 style={styles.apiCardTitle}>Configuração de Webhook</h3>
            </div>
            <div style={styles.webhookBox}>
              <div style={styles.webhookLabel}>URL DE ENTRADA UNIVERSAL</div>
              <div style={styles.webhookUrl}>
                <code>https://api.logdock.com/v1/incoming/998822-token-xyz</code>
                <Copy size={16} color="#0061FF" style={{ cursor: 'pointer' }} />
              </div>
              <p style={styles.webhookHint}>Envie qualquer JSON com campos como `placa`, `motorista` ou `file_url` para ativar módulos automaticamente.</p>
            </div>
          </div>
        </div>

        <div style={styles.apiSideCol}>
          <div style={styles.apiCard}>
            <div style={styles.apiCardHeader}>
              <h3 style={styles.apiCardTitle}>Logs de Entrada</h3>
              <div style={styles.statusDotGreen} />
            </div>
            <div style={styles.logList}>
              {logs.map(log => (
                <div key={log.id} style={styles.logItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#0061FF' }}>{log.method}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{log.time}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{log.endpoint}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{log.payload}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const PhotosView: React.FC<{ files: LogDockFile[] }> = ({ files }) => {
  const [zoom, setZoom] = useState(50);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [timeGrouping, setTimeGrouping] = useState('months');

  const mediaFiles = (files || []).filter(f => {
    const isMedia = f.type?.includes('image') || f.type?.includes('video');
    if (!isMedia) return false;
    if (mediaFilter === 'imagens') return f.type?.includes('image');
    if (mediaFilter === 'videos') return f.type?.includes('video');
    return true;
  });

  const grouped = mediaFiles.reduce((acc: any, file) => {
    const date = file.created_at ? new Date(file.created_at) : new Date();
    let key = '';
    if (timeGrouping === 'years') {
      key = date.getFullYear().toString();
    } else if (timeGrouping === 'days') {
      key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } else {
      key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {});

  return (
    <div style={styles.photosView}>
      <h2 style={styles.contentTitle}>Imagens</h2>
      
      <div style={styles.photosFilterBar}>
        <div style={styles.filterGroup}>
          <button 
            style={{...styles.filterBtn, ...(mediaFilter === 'all' ? styles.filterBtnActive : {})}}
            onClick={() => setMediaFilter('all')}
          >Todos os itens</button>
          <button 
            style={{...styles.filterBtn, ...(mediaFilter === 'imagens' ? styles.filterBtnActive : {})}}
            onClick={() => setMediaFilter('imagens')}
          >Imagens</button>
          <button 
            style={{...styles.filterBtn, ...(mediaFilter === 'videos' ? styles.filterBtnActive : {})}}
            onClick={() => setMediaFilter('videos')}
          >Vídeos</button>
          <button 
            style={{...styles.filterBtn, ...(mediaFilter === 'favorites' ? styles.filterBtnActive : {})}}
            onClick={() => setMediaFilter('favorites')}
          >Favoritos</button>
        </div>
        <div style={styles.filterDivider} />
        <div style={styles.filterGroup}>
          <button 
            style={{...styles.filterBtn, ...(timeGrouping === 'years' ? styles.filterBtnActive : {})}}
            onClick={() => setTimeGrouping('years')}
          >Anos</button>
          <button 
            style={{...styles.filterBtn, ...(timeGrouping === 'months' ? styles.filterBtnActive : {})}}
            onClick={() => setTimeGrouping('months')}
          >Meses</button>
          <button 
            style={{...styles.filterBtn, ...(timeGrouping === 'days' ? styles.filterBtnActive : {})}}
            onClick={() => setTimeGrouping('days')}
          >Dias</button>
        </div>

        <div style={styles.zoomControl}>
          <Minus size={16} />
          <input 
            type="range" 
            min="20" 
            max="100" 
            value={zoom} 
            onChange={(e) => setZoom(parseInt(e.target.value))}
            style={styles.zoomSlider} 
          />
          <Plus size={16} />
        </div>
      </div>

      <div style={styles.photosGrid}>
        {Object.entries(grouped).map(([key, items]: [string, any]) => (
          <div key={key} style={styles.monthSection}>
            <div style={styles.monthHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" style={styles.monthCheckbox} />
                <span style={styles.monthTitle}>{key}</span>
                <span style={styles.itemCount}>{items.length} itens</span>
              </div>
            </div>
            <div style={{ 
              ...styles.mediaGrid, 
              gridTemplateColumns: `repeat(auto-fill, minmax(${100 + (zoom * 2)}px, 1fr))` 
            }}>
              {items.map((item: any) => (
                <div key={item.id} style={styles.mediaItem}>
                  {item.type?.includes('image') ? (
                    <img src={item.path} style={styles.mediaThumb} alt={item.name} />
                  ) : (
                    <div style={styles.videoThumb}>
                      <Play size={32} color="white" fill="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SharedView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('recentes');

  return (
    <div style={styles.sharedView}>
      <h2 style={styles.contentTitle}>Compartilhados</h2>

      <div style={styles.sharedFilterBar}>
        <div style={styles.filterGroup}>
          <button
            style={{ ...styles.filterBtn, ...(activeSubTab === 'recentes' ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveSubTab('recentes')}
          >Recentes</button>
          <button
            style={{ ...styles.filterBtn, ...(activeSubTab === 'pastas' ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveSubTab('pastas')}
          >Pastas</button>
          <button
            style={{ ...styles.filterBtn, ...(activeSubTab === 'arquivos' ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveSubTab('arquivos')}
          >Arquivos</button>
          <button
            style={{ ...styles.filterBtn, ...(activeSubTab === 'compartilhado' ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveSubTab('compartilhado')}
          >Compartilhado</button>
          <button
            style={{ ...styles.filterBtn, ...(activeSubTab === 'links' ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveSubTab('links')}
          >Links visitados</button>
        </div>
      </div>

      <div style={styles.sharedContent}>
        {(activeSubTab === 'recentes' || activeSubTab === 'pastas' || activeSubTab === 'arquivos') && (
          <div style={styles.emptyShared}>
            <p style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>
              Suas pastas e arquivos compartilhados serão exibidos aqui para que sejam fáceis de encontrar.
            </p>
          </div>
        )}
        {activeSubTab === 'compartilhado' && (
          <div style={styles.list}>
            <div style={{ ...styles.fileRow, border: 'none', paddingBottom: '8px', cursor: 'default' }}>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>Nome</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>Criado em</div>
              <div style={{ width: '44px' }} />
            </div>
            {[
              { name: 'WOOPPRO', date: '28/2/2025 22:43' },
              { name: 'AMOSTRA FREE', date: '19/1/2025 19:16' },
              { name: 'VELOCIDADE', date: '18/1/2025 18:14' },
              { name: 'ECLIPSE', date: '18/1/2025 16:01' },
              { name: 'PILULAS', date: '18/1/2025 14:17' },
              { name: 'RAIOS DE LUZ', date: '18/1/2025 12:59' },
              { name: 'DIAGONAIS', date: '18/1/2025 02:25' },
              { name: 'MARROM VERDE', date: '18/1/2025 02:13' },
              { name: 'PORTA', date: '18/1/2025 02:08' },
            ].map((item, idx) => (
              <div key={idx} style={styles.fileRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <Folder size={20} color="#0061FF" fill="#0061FF" fillOpacity={0.2} />
                  <span style={styles.itemName}>{item.name}</span>
                </div>
                <span style={styles.itemMeta}>{item.date}</span>
                <MoreHorizontal size={20} color="#94A3B8" style={{ cursor: 'pointer', marginLeft: '24px' }} />
              </div>
            ))}
          </div>
        )}
        {activeSubTab === 'links' && (
          <div style={styles.list}>
            <div style={{ ...styles.fileRow, border: 'none', paddingBottom: '8px', cursor: 'default' }}>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>Nome</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>Criado em</div>
              <div style={{ width: '44px' }} />
            </div>
            {[
              { name: 'SS Sample Christmas 2024', date: '6/11/2024 10:31 • Ezra Cohen' },
              { name: 'SpotifyPhoneMockup', date: '5/11/2021 08:21' },
            ].map((item, idx) => (
              <div key={idx} style={styles.fileRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <Folder size={20} color="#0061FF" fill="#0061FF" fillOpacity={0.2} />
                  <span style={styles.itemName}>{item.name}</span>
                </div>
                <span style={styles.itemMeta}>{item.date}</span>
                <MoreHorizontal size={20} color="#94A3B8" style={{ cursor: 'pointer', marginLeft: '24px' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FileRequestsView: React.FC = () => (
  <div style={styles.emptyState}>
    <FileText size={64} color="#F1F1F1" strokeWidth={1} />
    <h3 style={{ color: '#64748B', marginTop: '16px' }}>Solicitações de Arquivo</h3>
    <p style={{ color: '#94A3B8', fontSize: '14px' }}>Nenhuma solicitação ativa no momento.</p>
  </div>
);

const DeletedFilesView: React.FC = () => (
  <div style={styles.emptyState}>
    <Trash2 size={64} color="#F1F1F1" strokeWidth={1} />
    <h3 style={{ color: '#64748B', marginTop: '16px' }}>Lixeira</h3>
    <p style={{ color: '#94A3B8', fontSize: '14px' }}>A lixeira está vazia.</p>
  </div>
);

const LogDockDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('logdock_theme');
    // Only use dark if the user explicitly chose it. Default is always 'light'.
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('logdock_theme', theme);
  }, [theme]);

  const [userType, setUserType] = useState<string | null>(() => localStorage.getItem('logdock_user_type'));
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => localStorage.getItem('logdock_onboarding_completed') === 'true');
  const [onboardingStep, setOnboardingStep] = useState<number>(() => {
    const s = localStorage.getItem('logdock_onboarding_step');
    return s ? parseInt(s, 10) : 1;
  });
  const [onboardingData, setOnboardingData] = useState(() => {
    const d = localStorage.getItem('logdock_onboarding_data');
    return d ? JSON.parse(d) : {
      fullName: '',
      phone: '',
      companyName: '',
      companyType: 'Autônomo',
      cnpj: '',
      fleetSize: '',
      userType: '',
      hasVehicles: 'Não',
      driverCount: '',
      wantsTracking: 'Não',
      organizeByClient: 'Não',
      autoRead: 'Não'
    };
  });
  const [files, setFiles] = useState<LogDockFile[]>([]);
  const [folders, setFolders] = useState<LogDockFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<LogDockFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string, name: string } | null>(null);
  const [navigationPath, setNavigationPath] = useState<{ id: string, name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'large-grid'>('grid');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [activeCollab, setActiveCollab] = useState<number | null>(null);

  const collaborators = [
    { id: 1, name: 'Ana Lima', email: 'ana.lima@empresa.com', phone: '(11) 98765-4321', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=60', role: 'Designer', files: ['Dashboard Designs.fig', 'Cloud Dashboard.fig', 'Mobile App UI.fig'] },
    { id: 2, name: 'Carlos Souza', email: 'carlos@empresa.com', phone: '(21) 91234-5678', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=60', role: 'Desenvolvedor', files: ['Project Brief.docx', 'Project Details.xls'] },
    { id: 3, name: 'Mariana Costa', email: 'mariana@empresa.com', phone: '(31) 99876-5432', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&auto=format&fit=crop&q=60', role: 'Gerente', files: ['Project Brief.docx', 'Design Notes.docx', 'Project Details.xls'] },
    { id: 4, name: 'Felipe Rocha', email: 'felipe@empresa.com', phone: '(51) 98888-1234', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=60', role: 'Analista', files: ['Design Notes.docx'] },
  ];

  const selectedCollab = collaborators.find(c => c.id === activeCollab);
  const [folderActionModal, setFolderActionModal] = useState<any | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<{ x: number, y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'file' | 'folder' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  
  // Dynamic styles based on theme
  const currentStyles = useMemo(() => {
    if (theme === 'dark') {
      return {
        ...styles,
        macProfilePopup: { ...styles.macProfilePopup, backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' },
        profileName: { ...styles.profileName, color: '#FFFFFF' },
        profileEmail: { ...styles.profileEmail, color: 'rgba(255,255,255,0.5)' },
        popupItem: { ...styles.popupItem, color: '#FFFFFF' },
        dropdownItem: { ...styles.dropdownItem, color: '#FFFFFF' },
      };
    }
    return {
      ...styles,
      dashboardContainer: { ...styles.dashboardContainer, backgroundColor: '#F8F9FA' },
      miniSidebar: { ...styles.miniSidebar, backgroundColor: '#FFFFFF', borderRight: '1px solid #EBEBEB' },
      main: { ...styles.main, backgroundColor: '#F8F9FA', border: '1px solid #EBEBEB', boxShadow: 'none' },
      header: { ...styles.header, borderBottom: '1px solid #F1F1F1', backgroundColor: '#FFFFFF' },
      searchBar: { ...styles.searchBar, backgroundColor: '#F8F9FA', border: '1px solid #EBEBEB' },
      searchInput: { ...styles.searchInput, color: '#334155' },
      statCard: { ...styles.statCard, backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
      statValue: { ...styles.statValue, color: '#334155' },
      statTitle: { ...styles.statTitle, color: '#64748B' },
      sectionTitle: { ...styles.sectionTitle, color: '#334155' },
      resultCard: { ...styles.resultCard, backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1' },
      resultTitle: { ...styles.resultTitle, color: '#334155' },
      fileCard: { ...styles.fileCard, backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1' },
      fileName: { ...styles.fileName, color: '#334155' },
      timelineSidebar: { ...styles.timelineSidebar, backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1', boxShadow: 'none' },
      timelineUser: { ...styles.timelineUser, color: '#334155' },
      timelineEvent: { ...styles.timelineEvent, color: '#64748B' },
      macProfilePopup: { ...styles.macProfilePopup, backgroundColor: '#FFFFFF', border: '1px solid #F1F1F1' },
      profileName: { ...styles.profileName, color: '#334155' },
      profileEmail: { ...styles.profileEmail, color: '#64748B' },
      popupItem: { ...styles.popupItem, color: '#334155' },
      dropdownItem: { ...styles.dropdownItem, color: '#334155' },
    };
  }, [theme]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const recentFilesRef = useRef<HTMLDivElement>(null);
  
  const [isDraggingCarousel, setIsDraggingCarousel] = useState(false);
  const [isDraggingRecent, setIsDraggingRecent] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handlers for Shared Folders Carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDraggingCarousel(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveCarousel = () => {
    setIsDraggingCarousel(false);
  };

  const handleMouseUp = () => {
    setIsDraggingCarousel(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCarousel || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handlers for Recent Files Carousel
  const handleMouseDownRecent = (e: React.MouseEvent) => {
    if (!recentFilesRef.current) return;
    setIsDraggingRecent(true);
    setStartX(e.pageX - recentFilesRef.current.offsetLeft);
    setScrollLeft(recentFilesRef.current.scrollLeft);
  };

  const handleMouseLeaveRecent = () => {
    setIsDraggingRecent(false);
  };

  const handleMouseUpRecent = () => {
    setIsDraggingRecent(false);
  };

  const [isActionSidebarOpen, setIsActionSidebarOpen] = useState(false);
  const [actionContext, setActionContext] = useState<any>(null);

  const openActionSidebar = (context: any) => {
    setActionContext(context);
    setIsActionSidebarOpen(true);
    setIsNotificationOpen(false); // Close notifications if opening an action
  };
  const handleMouseMoveRecent = (e: React.MouseEvent) => {
    if (!isDraggingRecent || !recentFilesRef.current) return;
    e.preventDefault();
    const x = e.pageX - recentFilesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    recentFilesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleUploadFiles(files);
  };

  const handleUploadFiles = (files: File[]) => {
    if (!profile?.company_id) {
      toast.error('Erro de autenticação. Tente recarregar a página.');
      return;
    }

    // Adaptive Intelligence: Auto-activation of modules
    const fileNames = files.map(f => f.name.toLowerCase());
    if (fileNames.some(n => n.includes('placa') || n.includes('carro') || n.includes('caminhao'))) activateModule('frota');
    if (fileNames.some(n => n.includes('cnh') || n.includes('motorista'))) activateModule('motoristas');
    if (fileNames.some(n => n.includes('nota') || n.includes('entrega'))) activateModule('entregas');

    files.forEach(async (file) => {
      const id = Math.random().toString(36).substr(2, 9);
      setUploadQueue(prev => [...prev, { id, name: file.name, progress: 0, status: 'uploading' }]);
      
      try {
        const date = new Date().toISOString().split('T')[0];
        const path = `uploads/${profile.id}/${date}_${file.name}`;
        
        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage.from('logdock').upload(path, file, {
          onUploadProgress: (progress) => {
            const p = Math.round((progress.loaded / progress.total) * 100);
            setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, progress: p } : item));
          }
        });

        if (uploadError) throw uploadError;

        // 2. Insert to DB
        const { error: dbError } = await supabase.from('files').insert({
          name: file.name,
          company_id: profile.company_id,
          folder_id: currentFolder?.id || null,
          size: file.size,
          type: file.type || 'application/octet-stream',
          path: path,
          is_favorite: activeTab === 'favorites',
          user_id: profile.id
        });

        if (dbError) throw dbError;

        setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, progress: 100, status: 'done' } : item));
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(item => item.id !== id));
          fetchData();
        }, 1000);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Falha no upload: ${file.name}`);
        setUploadQueue(prev => prev.filter(item => item.id !== id));
      }
    });
  };

  const generatePublicLink = async (file: any) => {
    const token = Math.random().toString(36).substr(2, 12);
    try {
      const { error } = await supabase.from('public_links').insert({
        id: token,
        file_id: file.id,
        created_by: profile?.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      });

      if (error) throw error;

      const publicUrl = `${window.location.origin}/public/${token}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link público gerado e copiado!');
    } catch (err) {
      toast.error('Erro ao gerar link público');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: any, type: 'file' | 'folder') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSettingsMenu(null);
      setIsLayoutMenuOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [storageStats, setStorageStats] = useState({ used: 48000000000, total: 50 * 1024 * 1024 * 1024, percent: 96 });
  const [globalStats, setGlobalStats] = useState({ containers: 0, filesToday: 0, pending: 3, space: '48 GB' });
  const [activeFilter, setActiveFilter] = useState<'recent' | 'favorites' | 'all'>('all');
  const [sections, setSections] = useState<{ id: string, name: string }[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || 'inicio';
  const setActiveTab = (tab: string) => navigate(`/app/${tab}`);
  const isRegistrar = location.pathname.includes('/app/registrar') || activeTab === 'registrar';
  const displayOnboarding = (!onboardingCompleted || isRegistrar);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [operationalEvents, setOperationalEvents] = useState<any[]>([]);

  const [isIntelSidebarOpen, setIsIntelSidebarOpen] = useState(false);
  const [selectedFileForIntel, setSelectedFileForIntel] = useState<LogDockFile | null>(null);



  const [activeModules, setActiveModules] = useState<string[]>(['inicio', 'container', 'equipe', 'ia']);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nudges, setNudges] = useState<{ id: string, message: string }[]>([]);

  const activateModule = (moduleId: string) => {
    if (!activeModules.includes(moduleId)) {
      setActiveModules(prev => [...prev, moduleId]);
      toast(`Módulo ${moduleId.toUpperCase()} ativado automaticamente!`, { icon: '🔌', duration: 4000 });
      addNudge(`Novo módulo ativado: ${moduleId.toUpperCase()}. Explore as novas funções!`);
    }
  };

  const addNudge = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNudges(prev => [...prev, { id, message }]);
  };

  const handleOnboardingComplete = (selections: string[]) => {
    setShowOnboarding(false);
    const toActivate = ['inicio', 'container', 'equipe', 'ia', ...selections.filter(s => s !== 'all')];
    if (selections.includes('all')) {
      toActivate.push('entregas', 'frota', 'motoristas', 'automacoes');
    }
    setActiveModules(toActivate);
    toast.success('LogDock configurado com sucesso!');
  };

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const isMaster = profile.role === 'MASTER' || profile.role === 'MASTER_ADMIN' || profile.role === 'ADMIN';
      let fQuery = supabase.from('files').select('*');
      let foldQuery = supabase.from('folders').select('*');

      if (!isMaster) {
        fQuery = fQuery.eq('company_id', profile.company_id);
        foldQuery = foldQuery.eq('company_id', profile.company_id);
      }

      if (activeTab === 'lixeira') {
        fQuery = fQuery.not('deleted_at', 'is', null);
        foldQuery = foldQuery.not('deleted_at', 'is', null);
      } else {
        fQuery = fQuery.is('deleted_at', null);
        foldQuery = foldQuery.is('deleted_at', null);

        if (activeTab === 'favorites') {
          fQuery = fQuery.eq('is_favorite', true);
          foldQuery = foldQuery.eq('is_favorite', true);
        } else if (activeTab === 'clientes') {
          fQuery = fQuery.ilike('name', '%cliente%');
        }

        if (searchTerm) {
          fQuery = fQuery.ilike('name', `%${searchTerm}%`);
          foldQuery = foldQuery.ilike('name', `%${searchTerm}%`);
        }

        if (currentFolder && activeTab !== 'favorites') {
          fQuery = fQuery.eq('folder_id', currentFolder.id);
          foldQuery = foldQuery.eq('parent_id', currentFolder.id);
        } else if (!['favorites', 'comprovantes', 'clientes'].includes(activeTab)) {
          fQuery = fQuery.is('folder_id', null);
          foldQuery = foldQuery.is('parent_id', null);
        }
      }

      const { data: fileData } = await fQuery.order('created_at', { ascending: false });
      setFiles(fileData || []);

      const { data: folderData } = await foldQuery;
      setFolders(folderData || []);

      // Set Recent Files for Dashboard
      if (fileData) {
        setRecentFiles(fileData.slice(0, 3));
      }

      // Calculate Dynamic Stats
      const totalSize = (fileData || []).reduce((acc, f) => acc + (f.size || 0), 0);
      setGlobalStats({
        containers: folderData?.length || 0,
        filesToday: fileData?.length || 0,
        pending: 3,
        space: formatSize(totalSize)
      });
      setStorageStats(prev => ({
        ...prev,
        used: totalSize,
        percent: Math.min(Math.round((totalSize / prev.total) * 100), 100)
      }));

      // Fetch Operational Memory Events
      try {
        const { data: eventData } = await supabase
          .from('logdock_events')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (eventData && eventData.length > 0) {
          setOperationalEvents(eventData);
        } else {
          // Fallback mock events for V3 Demo
          setOperationalEvents([
            { created_at: new Date().toISOString(), event_type: 'IA', details: 'IA identificou contexto: VEHICLE no arquivo SCANIA_DOC.PDF', entity_type: 'VEHICLE' },
            { created_at: new Date().toISOString(), event_type: 'SISTEMA', details: 'Doc. CNH verificado e validado', entity_type: 'DRIVER' },
          ]);
        }
      } catch (e) {
        // Table probably doesn't exist yet
        setOperationalEvents([
          { created_at: new Date().toISOString(), event_type: 'IA', details: 'IA em modo de simulação (aguardando migration)', entity_type: 'SYSTEM' }
        ]);
      }

    } catch (err) {
      toast.error('Erro ao sincronizar container.');
    } finally {
      setLoading(false);
    }
  };

  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredFolders = sortData(folders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeTab === 'favorites' ? true : f.parent_id === (currentFolder?.id || null))
  ));

  const filteredFiles = sortData(files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeTab === 'favorites' ? true : f.folder_id === (currentFolder?.id || null))
  ));

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  useEffect(() => {
    fetchData();
  }, [profile?.id, activeTab, currentFolder, searchTerm]);

  const handleRename = async (item: any, type: 'file' | 'folder') => {
    const newName = window.prompt(`Novo nome para ${item.name}:`, item.name);
    if (!newName || newName === item.name) return;

    try {
      const table = type === 'folder' ? 'folders' : 'files';
      const { error } = await supabase.from(table).update({ name: newName }).eq('id', item.id);
      if (error) throw error;
      toast.success('Renomeado com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao renomear item');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { error } = await supabase.from('folders').insert({
        name: newFolderName,
        parent_id: currentFolder?.id || null,
        company_id: profile?.company_id
      });
      if (error) throw error;
      toast.success('Container criado com sucesso');
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar container');
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      const { error } = await supabase.from('logdock_sections').insert({
        name: newSectionName,
        company_id: profile?.company_id,
        user_id: profile?.id
      });
      if (error) throw error;
      toast.success('Seção criada!');
      setNewSectionName('');
      setIsSectionModalOpen(false);
      fetchSections();
    } catch (error) {
      toast.error('Erro ao criar seção');
    }
  };

  const fetchSections = async () => {
    if (!profile) return;
    const { data } = await supabase.from('logdock_sections').select('*').eq('company_id', profile.company_id);
    setSections(data || []);
  };

  useEffect(() => {
    fetchSections();
  }, [profile?.id]);

  const handleRestore = async (item: any, type: 'file' | 'folder') => {
    try {
      const table = type === 'file' ? 'files' : 'folders';
      await supabase.from(table).update({ deleted_at: null }).eq('id', item.id);
      toast.success('Item restaurado!');
      fetchData();
    } catch (err) {
      toast.error('Erro ao restaurar.');
    }
  };

  const handleMove = async (item: any, type: 'file' | 'folder') => {
    const targetFolderId = window.prompt('Digite o UUID da pasta de destino (ou deixe em branco para raiz):');
    if (targetFolderId === null) return;

    try {
      const table = type === 'folder' ? 'folders' : 'files';
      const { error } = await supabase.from(table).update({
        [type === 'folder' ? 'parent_id' : 'folder_id']: targetFolderId || null
      }).eq('id', item.id);
      if (error) throw error;
      toast.success('Item movido com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao mover item');
    }
  };

  const handleContextAction = (action: string) => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case 'download': type === 'file' ? window.open(item.path, '_blank') : handleBulkDownload(); break;
      case 'rename': handleRename(item, type); break;
      case 'delete': handleDelete(item, type); break;
      case 'move': handleMove(item, type); break;
      case 'restore': handleRestore(item, type); break;
      case 'info': setFolderActionModal(item); break;
      case 'copyLink': type === 'file' ? generatePublicLink(item) : toast.error('Links públicos para pastas estarão disponíveis em breve'); break;
      default: toast.success(`Ação ${action} em desenvolvimento`);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !profile) return;
    const file = fileList[0];
    const tid = toast.loading(`Processando Inteligência: ${file.name}...`);
    
    try {
      const date = new Date().toISOString().split('T')[0];
      
      // LOGIC: Intelligent Context Identification (V3)
      let contextType = null;
      const fileNameUpper = file.name.toUpperCase();

      if (fileNameUpper.includes('ABC-1234') || fileNameUpper.includes('SCANIA') || fileNameUpper.includes('VOLVO')) {
        contextType = 'VEHICLE';
      } else if (fileNameUpper.includes('CNH') || fileNameUpper.includes('ALISON') || fileNameUpper.includes('SILVA')) {
        contextType = 'DRIVER';
      } else if (fileNameUpper.includes('ENTREG') || fileNameUpper.includes('ENT-')) {
        contextType = 'DELIVERY';
      }

      const path = `${profile.company_id}/logdock/${currentFolder?.name || 'geral'}/${date}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('logdock').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: newFile, error: insertError } = await supabase.from('files').insert({
        company_id: profile.company_id,
        folder_id: currentFolder?.id || null,
        name: file.name,
        path,
        type: file.type,
        size: file.size,
        ai_metadata: { context: contextType, processed: true }
      }).select().single();

      if (insertError) throw insertError;

      // Create Operational Memory Event
      if (contextType) {
        await supabase.from('logdock_events').insert({
          company_id: profile.company_id,
          user_id: profile.id,
          event_type: 'upload_arquivo',
          details: `IA identificou contexto: ${contextType} no arquivo ${file.name}`,
          entity_type: contextType,
          metadata: { filename: file.name, size: file.size }
        });
        toast.success(`Contexto ${contextType} identificado automaticamente!`, { icon: '🧠' });
      }

      toast.success('Memória Logística atualizada!', { id: tid });
      fetchData();
    } catch (err: any) {
      toast.error('Erro no processamento inteligente.', { id: tid });
    }
  };

  const getFileIcon = (type: string, size?: number) => {
    const iconSize = size || (viewMode === 'large-grid' ? 120 : 80);
    if (type?.includes('pdf')) return <FileText size={iconSize} color="#EF4444" strokeWidth={1.5} />;
    if (type?.includes('image')) return <ImageIcon size={iconSize} color="#0061FF" strokeWidth={1.5} />;
    if (type?.includes('video')) return <Play size={iconSize} color="#0061FF" strokeWidth={1.5} />;
    return <File size={iconSize} color="#94A3B8" strokeWidth={1.5} />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Deseja excluir permanentemente os ${selectedItems.length} itens selecionados?`)) return;
    setIsBulkActionLoading(true);
    try {
      await supabase.from('folders').delete().in('id', selectedItems);
      await supabase.from('files').delete().in('id', selectedItems);
      toast.success(`${selectedItems.length} itens removidos`);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir itens');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    setIsBulkActionLoading(true);
    toast.success('Download iniciado!');
    setIsBulkActionLoading(false);
  };

  const handleDelete = async (item: any, type: 'file' | 'folder') => {
    const isTrash = activeTab === 'lixeira';
    const msg = isTrash ? `Excluir permanentemente ${item.name}?` : `Mover ${item.name} para a lixeira?`;
    if (!window.confirm(msg)) return;

    try {
      const table = type === 'file' ? 'files' : 'folders';
      if (isTrash) {
        await supabase.from(table).delete().eq('id', item.id);
      } else {
        await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
      }
      toast.success(isTrash ? 'Excluído permanentemente!' : 'Movido para lixeira');
      fetchData();
    } catch (err) {
      toast.error('Erro na operação.');
    }
  };

  const [sidebarFlyout, setSidebarFlyout] = useState<'inicio' | 'pastas' | 'mais' | null>('inicio');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user && profile) {
      fetchRecentActivities();
    }
  }, [user, profile]);

  const fetchRecentActivities = async () => {
    try {
      const { data } = await supabase
        .from('file_logs')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentActivities(data || []);
    } catch (err) {
      console.error('Erro ao buscar atividades recentes:', err);
    }
  };

  const handleNextStep = () => {
    localStorage.setItem('logdock_onboarding_step', String(onboardingStep + 1));
    localStorage.setItem('logdock_onboarding_data', JSON.stringify(onboardingData));
    setOnboardingStep(onboardingStep + 1);
  };

  const handlePrevStep = () => {
    localStorage.setItem('logdock_onboarding_step', String(onboardingStep - 1));
    setOnboardingStep(onboardingStep - 1);
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem('logdock_onboarding_completed', 'true');
    localStorage.setItem('logdock_user_type', onboardingData.userType || 'drive');
    setOnboardingCompleted(true);
    setUserType(onboardingData.userType || 'drive');
    toast.success('Onboarding concluído com sucesso!', { icon: '✨' });
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* MULTI-STEP PREMIUM ONBOARDING WIZARD */}
      {displayOnboarding && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#F1F1F1', zIndex: 99999,
          display: 'grid', gridTemplateColumns: '480px 1fr',
          fontFamily: '"Outfit", "Inter", sans-serif'
        }}>
          {/* LEFT SIDE: PREMIUM GRADIENT ART CARD */}
          <div style={{
            margin: '24px', borderRadius: '32px',
            background: 'linear-gradient(135deg, #0061FF 0%, #0061FF 50%, #8B5CF6 100%)',
            padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            color: '#FFF', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Logo onlyIcon={true} size={42} color="#FFF" />
              <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>LogDock</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '1px' }}>
                Onboarding Inteligente
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 900, lineHeight: '1.2', margin: 0 }}>
                Seu ecossistema <br /> pessoal e de clareza operacional.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: 0, maxWidth: '380px' }}>
                Construa seu espaço de trabalho adaptado para o seu cenário em menos de 1 minuto.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: THE WIZARD WORKSPACE */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px', overflowY: 'auto'
          }}>
            {/* HEADER DO WIZARD: PROGRESSO */}
            <div style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} style={{
                    height: '6px', flex: 1, borderRadius: '3px',
                    backgroundColor: s <= onboardingStep ? '#0061FF' : '#F1F1F1',
                    transition: 'background-color 0.3s ease'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Etapa {onboardingStep} de 5
              </span>
            </div>

            <div style={{
              backgroundColor: '#FFF', border: '1px solid #F1F1F1', borderRadius: '32px',
              padding: '48px', width: '100%', maxWidth: onboardingStep === 3 ? '840px' : '560px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
              
              {/* ETAPA 1: IDENTIFICACAO */}
              {onboardingStep === 1 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#334155', margin: 0 }}>
                      Vamos começar 🚀
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                      Leva menos de 1 minuto para configurar seu LogDock.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Alison Thiago" 
                        style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold' }} 
                        value={onboardingData.fullName}
                        onChange={e => setOnboardingData({ ...onboardingData, fullName: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Telefone / WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="Ex: (11) 99999-9999" 
                        style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold' }} 
                        value={onboardingData.phone}
                        onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    style={{ padding: '16px 32px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' }}
                    onClick={handleNextStep}
                    disabled={!onboardingData.fullName}
                  >
                    Continuar
                  </button>
                </>
              )}

              {/* ETAPA 2: EMPRESA */}
              {onboardingStep === 2 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#334155', margin: 0 }}>
                      Sobre você ou sua empresa
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                      Essas informações ajudam a organizar melhor seu sistema.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Nome da Empresa (ou seu nome se for autônomo)</label>
                      <input 
                        type="text" 
                        placeholder="Minha Transportadora Ltda" 
                        style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold' }} 
                        value={onboardingData.companyName}
                        onChange={e => setOnboardingData({ ...onboardingData, companyName: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Tipo de Uso</label>
                      <select 
                        style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold', backgroundColor: '#FFF' }} 
                        value={onboardingData.companyType}
                        onChange={e => setOnboardingData({ ...onboardingData, companyType: e.target.value })}
                      >
                        <option value="Autônomo">Autônomo</option>
                        <option value="Transportadora">Transportadora</option>
                        <option value="Empresa">Empresa</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      style={{ flex: 1, padding: '16px', backgroundColor: '#FFF', color: '#64748B', border: '1px solid #F1F1F1', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer' }}
                      onClick={handlePrevStep}
                    >
                      Voltar
                    </button>
                    <button 
                      style={{ flex: 1, padding: '16px', backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: 'none' }}
                      onClick={handleNextStep}
                      disabled={!onboardingData.companyName}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* ETAPA 3: COMO VAI USAR */}
              {onboardingStep === 3 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#334155', margin: 0 }}>
                      Como você quer usar o LogDock?
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, textAlign: 'center' }}>
                      Vamos adaptar o sistema exatamente para o que você precisa.
                    </p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%' }}>
                    <div 
                      style={{
                        backgroundColor: onboardingData.userType === 'drive' ? '#EEF2FF' : '#FFF',
                        border: onboardingData.userType === 'drive' ? '2px solid #0061FF' : '2px solid #F1F1F1',
                        borderRadius: '24px', padding: '32px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s'
                      }}
                      onClick={() => { setOnboardingData({ ...onboardingData, userType: 'drive' }); setOnboardingStep(4); }}
                    >
                      <div style={{ backgroundColor: '#DBEAFE', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={24} color="#0061FF" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#334155', margin: '0 0 4px 0' }}>📦 Drive Inteligente</h3>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                          Organize documentos com IA e encontre tudo em segundos.
                        </p>
                      </div>
                    </div>

                    <div 
                      style={{
                        backgroundColor: onboardingData.userType === 'operacao' ? '#F0FDF4' : '#FFF',
                        border: onboardingData.userType === 'operacao' ? '2px solid #0061FF' : '2px solid #F1F1F1',
                        borderRadius: '24px', padding: '32px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s'
                      }}
                      onClick={() => { setOnboardingData({ ...onboardingData, userType: 'operacao' }); setOnboardingStep(4); }}
                    >
                      <div style={{ backgroundColor: '#F1F1F1', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={24} color="#0061FF" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#334155', margin: '0 0 4px 0' }}>🚛 Operação Logística</h3>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                          Gerencie frota, entregas e acompanhe tudo em tempo real.
                        </p>
                      </div>
                    </div>

                    <div 
                      style={{
                        backgroundColor: onboardingData.userType === 'hub' ? '#FEF2F2' : '#FFF',
                        border: onboardingData.userType === 'hub' ? '2px solid #EF4444' : '2px solid #F1F1F1',
                        borderRadius: '24px', padding: '32px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s'
                      }}
                      onClick={() => { setOnboardingData({ ...onboardingData, userType: 'hub' }); setOnboardingStep(4); }}
                    >
                      <div style={{ backgroundColor: '#FEE2E2', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={24} color="#EF4444" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#334155', margin: '0 0 4px 0' }}>🏢 HUB / Empresa</h3>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                          Controle clientes, planos e toda a operação em um só lugar.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    style={{ padding: '16px', backgroundColor: '#FFF', color: '#64748B', border: '1px solid #F1F1F1', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', marginTop: '12px', width: 'fit-content', alignSelf: 'center' }}
                    onClick={handlePrevStep}
                  >
                    Voltar para Empresa
                  </button>
                </>
              )}

              {/* ETAPA 4: CONFIGURAÇÃO RÁPIDA */}
              {onboardingStep === 4 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#334155', margin: 0 }}>
                      Ajustando seu sistema
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                      Só mais alguns detalhes para deixar tudo pronto.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(onboardingData.userType === 'operacao' || onboardingData.userType === 'hub') ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Você possui veículos?</label>
                          <select 
                            style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold', backgroundColor: '#FFF' }}
                            value={onboardingData.hasVehicles}
                            onChange={e => setOnboardingData({ ...onboardingData, hasVehicles: e.target.value })}
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Quantos motoristas?</label>
                          <input 
                            type="number" 
                            placeholder="Ex: 5" 
                            style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold' }} 
                            value={onboardingData.driverCount}
                            onChange={e => setOnboardingData({ ...onboardingData, driverCount: e.target.value })}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Deseja rastreamento em tempo real?</label>
                          <select 
                            style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold', backgroundColor: '#FFF' }}
                            value={onboardingData.wantsTracking}
                            onChange={e => setOnboardingData({ ...onboardingData, wantsTracking: e.target.value })}
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Deseja organizar documentos por cliente?</label>
                          <select 
                            style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold', backgroundColor: '#FFF' }}
                            value={onboardingData.organizeByClient}
                            onChange={e => setOnboardingData({ ...onboardingData, organizeByClient: e.target.value })}
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Deseja ativar leitura automática de arquivos?</label>
                          <select 
                            style={{ padding: '14px 20px', borderRadius: '16px', border: '1px solid #F1F1F1', fontSize: '14px', outline: 'none', fontWeight: 'bold', backgroundColor: '#FFF' }}
                            value={onboardingData.autoRead}
                            onChange={e => setOnboardingData({ ...onboardingData, autoRead: e.target.value })}
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      style={{ flex: 1, padding: '16px', backgroundColor: '#FFF', color: '#64748B', border: '1px solid #F1F1F1', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer' }}
                      onClick={() => setOnboardingStep(3)}
                    >
                      Voltar
                    </button>
                    <button 
                      style={{ flex: 1, padding: '16px', backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: 'none' }}
                      onClick={handleNextStep}
                    >
                      Finalizar configuração
                    </button>
                  </div>
                </>
              )}

              {/* ETAPA 5: FINALIZACAO */}
              {onboardingStep === 5 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#F1F1F1', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={36} color="#0061FF" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#334155', margin: 0 }}>
                      Tudo pronto, {onboardingData.fullName && onboardingData.fullName.trim() ? onboardingData.fullName.trim() : 'Alison'}! 🚀
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '420px', lineHeight: '1.4' }}>
                      Seu LogDock já está configurado e pronto para uso.
                    </p>
                  </div>

                  <button 
                    style={{ padding: '18px 32px', backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 900, cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 12px rgba(181, 217, 0, 0.2)' }}
                    onClick={handleFinishOnboarding}
                  >
                    Entrar no sistema
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 🚀 CLOUD DOCK PREMIUM DESIGN LAYOUT */}
      <div style={{ 
        ...currentStyles.dashboardContainer,
        display: 'flex', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        fontFamily: '"Outfit", "Inter", sans-serif',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        <aside style={{ 
          ...currentStyles.miniSidebar,
          width: isSidebarCollapsed ? '120px' : '280px', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0, padding: '24px 0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>

          <div style={{ 
            width: '56px', height: '56px', borderRadius: '16px', 
            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', 
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '32px' 
          }} onClick={() => navigate('/app/inicio')}>
            <Logo onlyIcon={true} size={42} />
          </div>

          {/* CORE NAV — sempre visível */}
          {[
            { id: 'inicio',   icon: <Home size={22} />,      label: 'Início' },
            { id: 'arquivos', icon: <HardDrive size={22} />, label: 'Meu Drive' },
            { id: 'lixeira',  icon: <Trash2 size={22} />,    label: 'Lixeira' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { navigate(`/app/${item.id}`); setActiveTab(item.id); }}
              title={item.label}
              style={{
                width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: activeTab === item.id ? '#0061FF' : 'transparent',
                color: activeTab === item.id ? '#FFF' : '#64748B',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
            </button>
          ))}

          {/* DIVIDER */}
          <div style={{ width: '32px', height: '1px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#EBEBEB', margin: '8px 0' }} />


          {/* PLAN-BASED NAV — só aparece se o plano incluir */}
          {[
            { id: 'torre-controle',  icon: <MapPin size={22} />,      label: 'Torre de Controle', plans: ['pro', 'enterprise'] },
            { id: 'frota',           icon: <Truck size={22} />,        label: 'Frota',             plans: ['pro', 'enterprise'] },
            { id: 'relatorios',      icon: <FileText size={22} />,     label: 'Relatórios',        plans: ['pro', 'enterprise'] },
            { id: 'portal-cliente',  icon: <UsersIcon size={22} />,    label: 'Portal do Cliente', plans: ['enterprise'] },
            { id: 'master',          icon: <ShieldCheck size={22} />,  label: 'Master Hub',        plans: ['enterprise'] },
          ].filter(item => {
            const plan = (profile as any)?.plan || 'pro'; // fallback pro para demo
            return item.plans.includes(plan);
          }).map(item => (
            <button
              key={item.id}
              onClick={() => { navigate(`/app/${item.id}`); setActiveTab(item.id); }}
              title={item.label}
              style={{
                width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: activeTab === item.id ? '#0061FF' : 'transparent',
                color: activeTab === item.id ? '#FFF' : '#64748B',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
            </button>
          ))}

          {/* BOTTOM PINNED GROUP */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>

            {/* SUPORTE */}
            <button
              title="Suporte — Abrir chamado"
              onClick={() => window.open('https://hub.logta.com.br/support', '_blank')}
              style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0FDF4'; (e.currentTarget.querySelector('svg') as SVGElement)?.setAttribute('stroke', '#10B981'); }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement)?.setAttribute('stroke', '#64748B'); }}
            >
              <HelpCircle size={22} />
            </button>

            {/* DIVIDER */}
            <div style={{ width: '32px', height: '1px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', margin: '4px 0' }} />


            {/* CONFIGURAÇÕES */}
            <button
              title="Configurações"
              onClick={() => setActiveTab('configuracoes')}
              style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: activeTab === 'configuracoes' ? '#0061FF' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'), border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === 'configuracoes' ? '#FFF' : (theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#94A3B8'), cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Settings size={22} />
            </button>


            {/* SAIR */}
            <button
              title="Sair"
              onClick={() => signOut()}
              style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={22} />
            </button>

          </div>
        </aside>

        {/* 🔔 NOTIFICATION PANEL (PREMIUM DARK IDENTITY) */}
        {isNotificationOpen && (
          <div style={{
            position: 'absolute', top: '80px', right: '40px', 
            width: '320px', maxHeight: '75vh',
            backgroundColor: '#1A1A1A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(0, 97, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF' }}>
                   <ShieldCheck size={20} />
                 </div>
                 <div>
                   <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>Central Inteligente</h3>
                 </div>
               </div>
               <button onClick={() => setIsNotificationOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFF' }}>
                 <X size={14} />
               </button>
            </div>
            
            <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {[
                 { id: 1, type: 'PENDING_DOC', title: 'Carga #8821 Pendente', desc: 'Falta comprovante de entrega.', color: '#0061FF', icon: <Clock size={16} /> },
                 { id: 2, type: 'VALIDATE', title: 'Documento Recebido', desc: 'Nota fiscal aguardando validação.', color: '#0061FF', icon: <FileText size={16} /> },
                 { id: 3, type: 'ARCHIVE', title: 'Operação Finalizada', desc: 'Pronta para ser arquivada.', color: '#34A853', icon: <CheckCircle2 size={16} /> },
               ].map((notif, idx) => (
                 <div 
                   key={idx} 
                   onClick={() => openActionSidebar({ 
                     type: notif.type, 
                     title: notif.type === 'PENDING_DOC' ? 'Solicitar Comprovante' : notif.type === 'VALIDATE' ? 'Validar Documento' : 'Arquivar Operação',
                     operation: notif.title.split(' ')[0] + ' ' + notif.title.split(' ')[1]
                   })}
                   style={{ 
                     padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', 
                     borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', 
                     display: 'flex', gap: '12px', alignItems: 'center', 
                     cursor: 'pointer', transition: 'all 0.2s ease' 
                   }} 
                   onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} 
                   onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                 >
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: notif.color, flexShrink: 0 }}>
                     {notif.icon}
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{notif.title}</div>
                     <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 500 }}>{notif.desc}</div>
                   </div>
                   <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                 </div>
               ))}
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
               <button onClick={() => { setIsNotificationOpen(false); setUnreadCount(0); }} style={{ background: 'none', border: 'none', color: '#0061FF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Marcar tudo como lido</button>
            </div>
          </div>
        )}

        {/* TIER 2: EXPLORER / NAVIGATION TREE SIDEBAR */}
        <aside style={{ 
          width: isSidebarCollapsed ? '84px' : '320px', 
          background: theme === 'dark' ? '#0F0F0F' : '#EBEBEB', 
          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #D1D1D1', 
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>

          <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #D1D1D1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#D1D1D1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {isSidebarCollapsed ? <ChevronRight size={18} color={theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B'} /> : <ChevronLeft size={18} color={theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B'} />}
              </div>
              {!isSidebarCollapsed && <span style={{ fontSize: '18px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#334155' }}>Painel</span>}
            </div>
            {!isSidebarCollapsed && (
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#D1D1D1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={16} color={theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B'} />
              </div>
            )}
          </div>



          {/* NAVIGATION MENU */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isSidebarCollapsed ? '20px 10px' : '12px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'inicio', label: 'Dashboard', icon: <Home size={16} /> },
              { id: 'operacoes', label: 'Operações', icon: <Box size={16} /> },
              { id: 'transportadores', label: 'Transportadores', icon: <Truck size={16} /> },
              { id: 'arquivos', label: 'Documentos', icon: <Files size={16} /> },
              { id: 'relatorios', label: 'Relatórios', icon: <Activity size={16} /> },
              { id: 'alertas', label: 'Alertas', icon: <Bell size={16} />, badge: '12' },
              { id: 'configuracoes', label: 'Configurações', icon: <Settings size={16} /> },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                style={{ 
                  width: '100%', 
                  height: isSidebarCollapsed ? '54px' : 'auto',
                  padding: isSidebarCollapsed ? '0' : '14px 18px', 
                  borderRadius: '12px', 
                  backgroundColor: activeTab === item.id ? (theme === 'dark' ? '#1A1A1A' : '#FFF') : 'transparent', 
                  border: activeTab === item.id ? (theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #D1D1D1') : 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between', 
                  color: activeTab === item.id 
                    ? (theme === 'dark' ? '#FFF' : '#0061FF') 
                    : (theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B'), 
                  boxShadow: activeTab === item.id ? (theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)') : 'none',
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                }}
                onMouseEnter={e => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
                    e.currentTarget.style.color = theme === 'dark' ? '#FFF' : '#334155';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isSidebarCollapsed ? '0' : '12px', justifyContent: 'center', width: isSidebarCollapsed ? '100%' : 'auto' }}>
                  {item.icon}
                  {!isSidebarCollapsed && <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && item.badge && (
                  <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* UPGRADE CARD */}
          {!isSidebarCollapsed && (
            <div style={{
              marginTop: 'auto', padding: '24px', borderRadius: '24px',
              background: theme === 'dark' ? '#141414' : '#FFFFFF',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #D1D1D1', position: 'relative', overflow: 'hidden',
              marginBottom: '24px',
              margin: '24px',
              boxShadow: theme === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '32px' }}>🚀</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: theme === 'dark' ? '#1A1A1A' : '#F1F1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <MoreHorizontal size={16} color={theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B'} />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px', fontSize: '15px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#334155' }}>Uso de Armazenamento</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: theme === 'dark' ? '#FFF' : '#334155' }}>{storageStats.used} / {storageStats.total}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B' }}>{storageStats.percent}%</span>
              </div>

              <div style={{ width: '100%', height: '6px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F1F1', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${storageStats.percent}%`, height: '100%', backgroundColor: storageStats.percent > 90 ? '#EF4444' : '#0061FF', borderRadius: '3px' }} />
              </div>

              <button 
                onClick={() => navigate('/plans')}
                style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '14px', backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0055E0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0061FF'}
              >
                <Zap size={16} />
                <span>Mudar de plano</span>
              </button>
            </div>
          )}
        </aside>


        {/* TIER 3: CONTENT WORKSPACE */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflowY: 'auto', 
            backgroundColor: theme === 'dark' ? '#0F0F0F' : '#F8F9FA',
            transition: 'background-color 0.3s ease'
          }}
        >
          
          {/* HEADER TOPO DO WORKSPACE (TRANSPARENTE E ROLÁVEL) */}
          <header style={{ padding: '24px 40px', backgroundColor: 'transparent', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* PAGE TITLE & SEARCH — LEFT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#334155', margin: 0, letterSpacing: '-0.5px' }}>
                {activeTab === 'inicio' ? 'Dashboard' : 
                 activeTab === 'arquivos' ? 'Meu Drive' : 
                 activeTab === 'lixeira' ? 'Lixeira' : 
                 activeTab === 'compartilhados' ? 'Compartilhados' :
                 activeTab === 'configuracoes' ? 'Configurações' :
                 activeTab === 'frota' ? 'Gestão de Frota' :
                 activeTab === 'motoristas' ? 'Motoristas' :
                 activeTab === 'manutencao' ? 'Manutenção' :
                 activeTab === 'entregas' ? 'Entregas' :
                 activeTab === 'clientes' ? 'Clientes' :
                 activeTab === 'torre' ? 'Torre de Controle' :
                 activeTab === 'hub' ? 'Master HUB' :
                 activeTab === 'portal' ? 'Portal do Cliente' :
                 activeTab === 'relatorios' ? 'Relatórios' : 'LogDock'}
              </h1>
              
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* COLLABORATORS AVATARS STACK */}
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '12px' }}>
                {[
                  { name: 'Ana Lima', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=60' },
                  { name: 'Carlos Souza', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=60' },
                  { name: 'Mariana Costa', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&auto=format&fit=crop&q=60' },
                  { name: 'Felipe Rocha', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=60' }
                ].map((col, i) => (
                  <div key={i} style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', border: theme === 'dark' ? '2px solid #141414' : '2px solid #FFF', marginLeft: i === 0 ? 0 : '-10px', cursor: 'pointer', zIndex: 10 - i, transition: '0.2s', backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F1F1F1', overflow: 'hidden' }}>
                    <img alt={col.name} src={col.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F1F1F1', border: theme === 'dark' ? '2px solid #141414' : '2px solid #FFF', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748B', cursor: 'pointer', zIndex: 5 }}>+8</div>

                <div 
                  title="Convidar colaborador" 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', border: '2px dashed #0061FF', marginLeft: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
                  onClick={() => setIsInviteOpen(true)}
                >
                  <Plus size={16} color="#0061FF" />
                </div>
              </div>

              {/* ACTION: COMPARTILHAR */}
              <button 
                onClick={() => navigate('/team')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F1F1F1', color: theme === 'dark' ? '#FFF' : '#334155', border: 'none', borderRadius: '16px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#222222' : '#EBEBEB'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1A1A1A' : '#F1F1F1'}
              >
                <Share2 size={16} />
                <span>Compartilhar</span>
              </button>

              {/* ACTION: MUDAR DE PLANO */}
              <button 
                onClick={() => navigate('/plans')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', backgroundColor: '#0061FF', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(181, 217, 0, 0.15)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A3C200'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0061FF'}
              >
                <Zap size={16} />
                <span>Mudar de plano</span>
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />

              {/* PROFILE FLYOUT TOGGLE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingLeft: '16px', borderLeft: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1' }}>
                
                {/* THEME TOGGLE BUTTON */}
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '14px', 
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', 
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: theme === 'dark' ? '#FFB800' : '#334155', 
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: theme === 'dark' ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  title={theme === 'dark' ? 'Mudar para modo dia' : 'Mudar para modo noite'}
                >
                  {theme === 'dark' ? <Sun size={18} fill="#FFB800" /> : <Moon size={18} fill="#334155" />}
                </button>

                {/* NOTIFICATION BUTTON */}
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '14px', 
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', 
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F1F1F1', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: theme === 'dark' ? '#FFF' : '#334155', 
                    cursor: 'pointer', position: 'relative', transition: '0.2s' 
                  }}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#EF4444', border: theme === 'dark' ? '2px solid #1A1A1A' : '2px solid #FFF', color: '#FFF', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount}
                    </div>
                  )}
                </button>


                <div 
                  onClick={() => setIsActivityOpen(!isActivityOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                    {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
                  </span>

                  <div 
                    style={{ 
                      width: '44px', height: '44px', borderRadius: '14px', 
                      backgroundColor: '#0061FF', color: '#FFF', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '15px', fontWeight: 900, boxShadow: 'none',
                      overflow: 'hidden'
                    }}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      profile?.full_name?.[0] || 'A'
                    )}
                  </div>
                </div>
                {isActivityOpen && (
                  <ProfilePopup 
                    profile={profile} 
                    storage={storageStats} 
                    onClose={() => setIsActivityOpen(false)} 
                    onUpgrade={() => navigate('/plans')} 
                    onNavigate={async (t, data) => {
                      if (t === 'upload_profile_photo') {
                        const file = data as File;
                        const toastId = toast.loading('Enviando foto de perfil...');
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
                          const filePath = `avatars/${fileName}`;

                          const { error: uploadError } = await supabase.storage
                            .from('avatars')
                            .upload(filePath, file);

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(filePath);

                          const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ avatar_url: publicUrl })
                            .eq('id', user?.id);

                          if (updateError) throw updateError;

                          setProfile({ ...profile, avatar_url: publicUrl });
                          toast.success('Foto de perfil atualizada!', { id: toastId });
                        } catch (err: any) {
                          toast.error('Erro ao subir foto: ' + err.message, { id: toastId });
                        }
                        return;
                      }
                      setActiveTab(t);
                      setIsActivityOpen(false);
                    }} 
                  />
                )}
              </div>
            </div>
          </header>

          {/* PAGE INNER CONTENT WRAPPER */}
          <div style={{ padding: '20px 32px 64px 32px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme === 'dark' ? '#0F0F0F' : '#F8F9FA' }}>
            <div style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111111' : '#FFFFFF', borderRadius: '32px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #EBEBEB', padding: '32px 64px 64px 64px', boxShadow: theme === 'dark' ? '0 40px 100px rgba(0,0,0,0.4)' : 'none', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>

            {(() => {
              return (
                <>
                  {/* Collaborator stack removed - moved to header */}

                  {/* COLLABORATOR PROFILE POPUP */}
                  {selectedCollab && (
                    <div style={{
                      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'none',
                      zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} onClick={() => setActiveCollab(null)}>
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          backgroundColor: '#FFF', borderRadius: '32px', width: '760px',
                          boxShadow: 'none', overflow: 'hidden',
                          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex', flexDirection: 'column'
                        }}
                      >
                        {/* HERO BANNER */}
                        <div style={{
                          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                          padding: '32px 36px 28px',
                          display: 'flex', alignItems: 'flex-start', gap: '24px', position: 'relative'
                        }}>
                          {/* Avatar grande */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={selectedCollab.avatar}
                              alt={selectedCollab.name}
                              style={{ width: '80px', height: '80px', borderRadius: '24px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.15)' }}
                            />
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#0061FF', border: '2px solid #0F172A' }} />
                          </div>

                          {/* Nome + cargo + badges */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginBottom: '4px', letterSpacing: '-0.5px' }}>{selectedCollab.name}</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '16px' }}>{selectedCollab.role}</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ backgroundColor: 'rgba(181,217,0,0.15)', color: '#0061FF', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid rgba(181,217,0,0.25)' }}>
                                ● Acesso Ativo
                              </span>
                              <span style={{ backgroundColor: 'rgba(0,97,255,0.15)', color: '#60A5FA', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid rgba(0,97,255,0.25)' }}>
                                {selectedCollab.files.length} arquivos compartilhados
                              </span>
                            </div>
                          </div>

                          {/* Close button */}
                          <button
                            onClick={() => setActiveCollab(null)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* BODY — 2 colunas */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>

                          {/* COLUNA ESQUERDA — Contato */}
                          <div style={{ padding: '28px 32px', borderRight: '1px solid #F1F1F1' }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>Informações de Contato</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#F1F1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Mail size={16} color="#0061FF" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>E-mail</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{selectedCollab.email}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#F1F1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Phone size={16} color="#0061FF" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>Telefone</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{selectedCollab.phone}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#F1F1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ShieldCheck size={16} color="#0061FF" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>Nível de Permissão</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Editor</div>
                                </div>
                              </div>
                            </div>

                            {/* AÇÕES */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
                              <button style={{ width: '100%', padding: '12px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Send size={14} />
                                Enviar Mensagem
                              </button>
                              <button style={{ width: '100%', padding: '12px', backgroundColor: '#FFF', color: '#EF4444', border: '1px solid #FEE2E2', borderRadius: '14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                                Revogar Acesso
                              </button>
                            </div>
                          </div>

                          {/* COLUNA DIREITA — Arquivos */}
                          <div style={{ padding: '28px 32px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>
                              Arquivos Compartilhados
                              <span style={{ marginLeft: '8px', backgroundColor: '#F1F1F1', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontSize: '10px' }}>
                                {selectedCollab.files.length}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {selectedCollab.files.map((file, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#F1F1F1', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F1F1F1')}
                                >
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileText size={15} color="#0061FF" />
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', flex: 1 }}>{file}</span>
                                  <ExternalLink size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'inicio' && (
                <DashboardView 
                  stats={globalStats} 
                  events={operationalEvents} 
                  setActiveTab={setActiveTab} 
                  files={files} 
                  folders={folders} 
                  carouselRef={carouselRef}
                  isDraggingCarousel={isDraggingCarousel}
                  handleMouseDown={handleMouseDown}
                  handleMouseLeaveCarousel={handleMouseLeaveCarousel}
                  handleMouseUp={handleMouseUp}
                  handleMouseMove={handleMouseMove}
                  
                  recentFilesRef={recentFilesRef}
                  isDraggingRecent={isDraggingRecent}
                  handleMouseDownRecent={handleMouseDownRecent}
                  handleMouseLeaveRecent={handleMouseLeaveRecent}
                  handleMouseUpRecent={handleMouseUpRecent}
                  handleMouseMoveRecent={handleMouseMoveRecent}
                  openActionSidebar={openActionSidebar}
                  styles={currentStyles}
                  theme={theme}
                />
              )}
              {activeTab === 'operacoes' && <OperationalMemoryView stats={globalStats} events={operationalEvents} styles={currentStyles} theme={theme} />}
              {activeTab === 'equipe' && <TeamPage styles={currentStyles} />}
              {activeTab === 'api' && <UserAPIs styles={currentStyles} />}
              {activeTab === 'torre-controle' && <ControlTowerPage />}
              {activeTab === 'master' && <MasterHubPage />}
              {activeTab === 'portal-cliente' && <ClientPortalPage />}
              {activeTab === 'relatorios' && <ResultsMemoryPage />}
              {activeTab === 'arquivos' && (
                <FileExplorerView 
                  folders={filteredFolders} 
                  files={filteredFiles} 
                  currentPath={navigationPath} 
                  isNewMenuOpen={isNewMenuOpen}
                  setIsNewMenuOpen={setIsNewMenuOpen}
                  onFolderClick={(f) => {
                    setCurrentFolder(f);
                    setNavigationPath([...navigationPath, { id: f.id, name: f.name }]);
                  }}
                  onBack={() => {
                    const newPath = [...navigationPath];
                    newPath.pop();
                    setNavigationPath(newPath);
                    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null);
                  }}
                  onNewFolder={() => setIsNewFolderModalOpen(true)}
                  isDragging={isDragging}
                />
              )}
              {activeTab === 'equipe' && <TeamPage />}
              {activeTab === 'configuracoes' && <SettingsPage />}
              {activeTab === 'conta' && <ProfilePage />}
              {activeTab === 'perfil' && <ProfilePage />}
              {activeTab === 'faturamento' && <BillingPage />}
              {activeTab === 'billing' && <BillingPage />}
              {activeTab === 'automacoes' && <AutomationsPage />}
              {activeTab === 'api' && <UserAPIs />}
              {activeTab === 'interacoes' && <UserInteractions />}
              {activeTab === 'frota' && <FleetPage />}
              {activeTab === 'motoristas' && <DriversPage />}
              {activeTab === 'manutencao' && <MaintenancePage />}
              {activeTab === 'entregas' && <DeliveriesPage />}
              {activeTab === 'clientes' && <ClientsPage />}
            </div>

            {/* ACTION SIDEBAR (PREMIUM DARK IDENTITY) */}
            {isActionSidebarOpen && actionContext && (
              <>
                <div 
                  onClick={() => setIsActionSidebarOpen(false)}
                  style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 4999 }} 
                />
                <div style={{ 
                  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                  width: '820px', maxHeight: '90vh', 
                  backgroundColor: '#1A1A1A', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.6)', zIndex: 5000, display: 'flex', flexDirection: 'column', 
                  overflow: 'hidden', animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                {/* Header Section */}
                <div style={{ padding: '40px 32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: actionContext.type === 'PENDING_DOC' ? 'rgba(0,97,255,0.15)' : 'rgba(52,168,83,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      {actionContext.type === 'PENDING_DOC' ? <Clock size={24} color="#0061FF" /> : <ShieldCheck size={24} color="#34A853" />}
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.5px' }}>{actionContext.title}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Operação em tempo real</span>
                  </div>
                  <button 
                    onClick={() => setIsActionSidebarOpen(false)} 
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Section */}
                <div style={{ flex: 1, padding: '0 40px 40px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  
                  {/* Left Column: Context & Identity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Dados da Operação</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'rgba(0, 97, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 97, 255, 0.1)' }}>
                            <Truck size={24} color="#0061FF" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{actionContext.operation}</span>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>ID LogDock: {Math.floor(Math.random() * 10000)}</span>
                          </div>
                        </div>
                        
                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Status Atual</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0061FF' }}>Aguardando Ação</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Prioridade</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>Alta</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Insights & Recommendation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: 'rgba(0, 97, 255, 0.05)', borderRadius: '32px', padding: '32px', border: '1px solid rgba(0, 97, 255, 0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 10px #0061FF' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#0061FF', textTransform: 'uppercase', letterSpacing: '1px' }}>Recomendação IA</span>
                      </div>
                      <p style={{ fontSize: '15px', color: '#FFF', fontWeight: 600, lineHeight: '1.6', margin: 0 }}>
                        {actionContext.type === 'PENDING_DOC' ? 'O transportador ainda não anexou o comprovante. A IA sugere notificação imediata para evitar atrasos na baixa.' : 
                         actionContext.type === 'VALIDATE' ? 'Dados extraídos conferem com o manifesto (99.8% precisão). Recomendamos a liberação imediata.' :
                         'A operação foi processada com sucesso. O arquivamento liberará memória operacional.'}
                      </p>
                    </div>

                    {actionContext.type === 'VALIDATE' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Placa Detectada</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFF' }}>ABC-1234</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Confiança IA</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#34A853' }}>99.8%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setIsActionSidebarOpen(false)}
                    style={{ flex: 1, padding: '18px', backgroundColor: 'transparent', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Ignorar
                  </button>
                  <button 
                    onClick={() => { toast.success('Ação executada com sucesso!'); setIsActionSidebarOpen(false); }}
                    style={{ flex: 2, padding: '18px', backgroundColor: actionContext.type === 'PENDING_DOC' ? '#25D366' : '#0061FF', color: '#FFF', border: 'none', borderRadius: '18px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {actionContext.type === 'PENDING_DOC' && <MessageSquare size={16} />}
                    {actionContext.type === 'PENDING_DOC' ? 'Notificar WhatsApp' : actionContext.type === 'VALIDATE' ? 'Validar e Liberar' : 'Confirmar'}
                  </button>
                </div>
              </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardMinimalView: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={styles.pageTitle}>Início</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '8px 16px', border: '1px solid #F1F1F1', borderRadius: '6px', background: '#FFF', fontSize: '13px', fontWeight: '600' }}>Recentes</button>
          <button style={{ padding: '8px 16px', border: '1px solid #F1F1F1', borderRadius: '6px', background: '#FFF', fontSize: '13px', fontWeight: '600' }}>Favoritos</button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Saúde da Frota</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={styles.statValue}>98%</span>
            <span style={styles.statTrend}>↑ 2%</span>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Conformidade</span>
          <span style={styles.statValue}>85%</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Alertas Críticos</span>
          <span style={{ ...styles.statValue, color: '#EF4444' }}>3</span>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Sugestões para você</h2>
      <div style={styles.fileGrid}>
        {[
          { name: 'Relatórios Mensais', meta: 'Pasta • Modificado há 2h', type: 'folder' },
          { name: 'Contratos_2024.pdf', meta: 'PDF • Modificado há 5h', type: 'file' },
          { name: 'Manutenções_Abril', meta: 'Planilha • Modificado ontem', type: 'excel' },
          { name: 'Checklist_Segurança', meta: 'Documento • Modificado há 3 dias', type: 'doc' },
        ].map((item, i) => (
          <div key={i} style={styles.fileCard}>
             <div style={styles.fileIconBox}>
               {item.type === 'folder' ? <Box size={24} color="#0061FF" /> : <Files size={24} color="#64748B" />}
             </div>
             <div style={styles.fileInfo}>
               <span style={styles.fileName}>{item.name}</span>
               <span style={styles.fileMeta}>{item.meta}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FileExplorerView: React.FC<{ 
  folders: any[], 
  files: any[], 
  currentPath: { id: string, name: string }[],
  onFolderClick: (folder: any) => void,
  onBack: () => void,
  onNewFolder: () => void,
  isDragging: boolean,
  isNewMenuOpen: boolean,
  setIsNewMenuOpen: (val: boolean) => void
}> = ({ folders, files, currentPath, onFolderClick, onBack, onNewFolder, isDragging, isNewMenuOpen, setIsNewMenuOpen }) => {
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeMenus = () => {
    setIsFolderMenuOpen(false);
    setContextMenu(null);
  };

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      onContextMenu={handleContextMenu}
      onClick={closeMenus}
    >
      {/* BREADCRUMBS ROW */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
        <span 
          onClick={onBack}
          style={{ fontSize: '18px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
        >
          Meu Drive
        </span>
        {currentPath.length > 0 && (
          <>
            <ChevronRight size={16} color="#94A3B8" />
            <div 
              style={{ position: 'relative' }}
              onClick={(e) => { e.stopPropagation(); setIsFolderMenuOpen(!isFolderMenuOpen); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '10px', backgroundColor: '#F8FAFC', cursor: 'pointer', border: '1px solid #F1F1F1' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{currentPath[currentPath.length - 1].name}</span>
                <ChevronDown size={16} color="#0F172A" />
              </div>

              {isFolderMenuOpen && (
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, marginTop: '8px', 
                  width: '320px', backgroundColor: '#1A1A1A', borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', padding: '8px', zIndex: 100,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <FolderPlus size={18} color="rgba(255,255,255,0.5)" />
                      <span>Nova pasta</span>
                    </div>
                    <span style={styles.shortcutText}>^C, depois F</span>
                  </button>
                  <div style={styles.menuDivider} />
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Download size={18} color="rgba(255,255,255,0.5)" />
                      <span>Baixar</span>
                    </div>
                  </button>
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Edit2 size={18} color="rgba(255,255,255,0.5)" />
                      <span>Renomear</span>
                    </div>
                    <span style={styles.shortcutText}>⌥⌘E</span>
                  </button>
                  <div style={styles.menuDivider} />
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <UserPlus size={18} color="rgba(255,255,255,0.5)" />
                      <span>Compartilhar</span>
                    </div>
                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                  </button>
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Folder size={18} color="rgba(255,255,255,0.5)" />
                      <span>Organizar</span>
                    </div>
                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                  </button>
                  <button 
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Info size={18} color="rgba(255,255,255,0.5)" />
                      <span>Informações da pasta</span>
                    </div>
                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                  </button>
                  <div style={styles.menuDivider} />
                  <button 
                    style={{ ...styles.dropdownItem, color: '#EF4444' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Trash2 size={18} color="#EF4444" />
                      <span>Mover para a lixeira</span>
                    </div>
                    <span style={styles.shortcutText}>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FILTER & ACTIONS ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left Side: Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['Tipo', 'Pessoas', 'Modificado', 'Fonte'].map(filter => (
            <div key={filter} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: filter === 'Pessoas' ? '#F1F1F1' : '#FFF',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155'
            }}>
              <span>{filter}</span>
              <ChevronDown size={14} color="#64748B" />
            </div>
          ))}
        </div>

        {/* Right Side: Actions & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sort Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '20px', backgroundColor: '#E0EFFF', cursor: 'pointer' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0061FF' }}>Nome</span>
            <ArrowUp size={14} color="#0061FF" />
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#FFF' }}>
            <div style={{ padding: '8px 12px', borderRight: '1px solid #F1F1F1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <List size={16} color="#0F172A" />
            </div>
            <div style={{ padding: '8px 12px', backgroundColor: '#E0EFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} color="#0F172A" />
              <Grid size={16} color="#0F172A" />
            </div>
          </div>

          {/* Filter Funnel Icon */}
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E2E8F0', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Filter size={16} color="#64748B" />
          </button>

          {/* NOVO BUTTON */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              style={{ padding: '10px 20px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E293B'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0F172A'}
            >
              <Plus size={16} />
              <span>Novo</span>
              <ChevronDown size={14} />
            </button>

            {isNewMenuOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                  onClick={() => setIsNewMenuOpen(false)} 
                />
                <div style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                  width: '240px', backgroundColor: '#FFF', borderRadius: '16px', 
                  border: '1px solid #F1F1F1', padding: '8px', zIndex: 50,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  <button 
                    onClick={() => { setIsNewMenuOpen(false); onNewFolder(); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1E293B', fontSize: '13px', fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PremiumFolderIcon width={16} height={12} />
                    <span>Pasta</span>
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#F1F1F1', margin: '4px 0' }} />
                  <button 
                    onClick={() => { setIsNewMenuOpen(false); window.open('https://docs.google.com/document/create', '_blank'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1E293B', fontSize: '13px', fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img src="https://img.icons8.com/color/48/microsoft-word-2019.png" style={{ width: '16px', height: '16px' }} alt="" />
                    <span>Documento (Google Docs)</span>
                  </button>
                  <button 
                    onClick={() => { setIsNewMenuOpen(false); window.open('https://sheets.google.com/create', '_blank'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1E293B', fontSize: '13px', fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img src="https://img.icons8.com/color/48/microsoft-excel-2019.png" style={{ width: '16px', height: '16px' }} alt="" />
                    <span>Planilha (Google Sheets)</span>
                  </button>
                  <button 
                    onClick={() => { setIsNewMenuOpen(false); window.open('https://slides.google.com/create', '_blank'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1E293B', fontSize: '13px', fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img src="https://img.icons8.com/color/48/microsoft-powerpoint-2019.png" style={{ width: '16px', height: '16px' }} alt="" />
                    <span>Apresentação (Google Slides)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOLDERS SECTION */}
      {folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {folders.map(folder => (
              <div 
                key={folder.id}
                onClick={() => onFolderClick(folder)}
                style={{ 
                  padding: '20px', backgroundColor: '#FFF', border: '1px solid #F1F1F1', borderRadius: '20px', 
                  display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0061FF'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#F1F1F1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PremiumFolderIcon width={32} height={24} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILES SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', flex: 1, minHeight: files.length === 0 ? '120px' : 'auto' }}>

        
        {files.length > 0 && (
          <div style={{ backgroundColor: '#FFF', border: '1px solid #F1F1F1', borderRadius: '24px', overflow: 'hidden', boxShadow: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F1F1' }}>
                  <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#1E1E1B', letterSpacing: '1px' }}>NOME</th>
                  <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#1E1E1B', letterSpacing: '1px' }}>MODIFICADO</th>
                  <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#1E1E1B', letterSpacing: '1px' }}>TAMANHO</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr 
                    key={file.id} 
                    style={{ borderBottom: '1px solid #F1F1F1', transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {file.type?.includes('image') ? <ImageIcon size={18} color="#0061FF" /> : <FileText size={18} color="#64748B" />}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{file.name}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Há 2 dias</td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                      {file.size ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : '--'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F1F1F1' }}>
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isDragging && (
          <div style={{ 
            padding: '80px 40px', textAlign: 'center', backgroundColor: '#F8FAFF', borderRadius: '24px', border: '2px dashed #F1F1F1',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
            position: files.length > 0 ? 'absolute' : 'relative',
            inset: 0,
            zIndex: 20
          }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'none' }}>
              <Upload size={32} color="#0061FF" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#334155', margin: '0 0 4px 0' }}>Solte o arquivo aqui</h4>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Para iniciar o upload agora</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ 
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, 
          width: '280px', backgroundColor: '#1A1A1A', borderRadius: '12px', 
          border: '1px solid rgba(255,255,255,0.1)', padding: '8px', zIndex: 10000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column'
        }} onClick={e => e.stopPropagation()}>
          <button 
            style={styles.dropdownItem} 
            onClick={() => { onNewFolder(); setContextMenu(null); }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <FolderPlus size={18} color="rgba(255,255,255,0.5)" />
              <span>Nova pasta</span>
            </div>
            <span style={styles.shortcutText}>^C, depois F</span>
          </button>
          <div style={styles.menuDivider} />
          <button 
            style={styles.dropdownItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Upload size={18} color="rgba(255,255,255,0.5)" />
              <span>Upload de arquivo</span>
            </div>
            <span style={styles.shortcutText}>^C, depois U</span>
          </button>
          <button 
            style={styles.dropdownItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Folder size={18} color="rgba(255,255,255,0.5)" />
              <span>Upload de pasta</span>
            </div>
            <span style={styles.shortcutText}>^C, depois I</span>
          </button>
          <div style={styles.menuDivider} />
          <button 
            style={styles.dropdownItem} 
            onClick={() => window.open('https://docs.google.com/document/create', '_blank')}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <img src="https://img.icons8.com/color/48/microsoft-word-2019.png" style={{ width: '18px', height: '18px' }} alt="" />
              <span>Documentos Google</span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </button>
          <button 
            style={styles.dropdownItem} 
            onClick={() => window.open('https://sheets.google.com/create', '_blank')}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <img src="https://img.icons8.com/color/48/microsoft-excel-2019.png" style={{ width: '18px', height: '18px' }} alt="" />
              <span>Planilhas Google</span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </button>
          <button 
            style={styles.dropdownItem} 
            onClick={() => window.open('https://slides.google.com/create', '_blank')}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <img src="https://img.icons8.com/color/48/microsoft-powerpoint-2019.png" style={{ width: '18px', height: '18px' }} alt="" />
              <span>Apresentações Google</span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </button>
          <button 
            style={styles.dropdownItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Play size={18} color="#8B5CF6" />
              <span>Google Vids</span>
            </div>
          </button>
          <button 
            style={styles.dropdownItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <FileText size={18} color="#8B5CF6" />
              <span>Formulários Google</span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </button>
          <button 
            style={styles.dropdownItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <span>Mais</span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </button>
        </div>
      )}
    </div>
  );
};

const LogDockApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LogDockLogin />} />
      <Route path="/app" element={<Navigate to="/app/inicio" replace />} />
      <Route path="/app/*" element={<ProtectedRoute><LogDockDashboard /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


export default LogDockApp;
