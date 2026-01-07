// constants/dummyData.ts

// reported post (Moderator Use)
export const MOCK_REPORTS = [
  {
    id: '1',
    reportedUser: 'User_X',
    reason: 'Hate Speech',
    content: 'I hate everyone here and I want to...',
    timestamp: '2025-12-14 10:30 AM',
    status: 'Pending',
  },
  {
    id: '2',
    reportedUser: 'BadGuy123',
    reason: 'Harassment',
    content: 'You are stupid and nobody likes you.',
    timestamp: '2025-12-14 11:00 AM',
    status: 'Pending',
  },
  {
    id: '3',
    reportedUser: 'Spammer007',
    reason: 'Spam',
    content: 'Click this link to win 1000RM immediately!',
    timestamp: '2025-12-14 11:05 AM',
    status: 'Pending',
  },
];

//student who apply to become Peer Helper  (Counselor Use)
export const MOCK_APPLICATIONS = [
  {
    id: '101',
    name: 'Ali bin Ahmad',
    studentId: '121111',
    cgpa: '3.8',
    status: 'Pending',
  },
  {
    id: '102',
    name: 'Mei Ling',
    studentId: '121112',
    cgpa: '3.9',
    status: 'Pending',
  },
];