-- 1. ACCOUNT
CREATE TABLE account (
    accountID UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255), -- Supabase Auth 
    role VARCHAR(20) CHECK (role IN ('User', 'Admin', 'Counselor', 'PeerHelper', 'Moderator')) DEFAULT 'User',
    isVerified BOOLEAN DEFAULT FALSE,
    accountStatus VARCHAR(20) DEFAULT 'Active',
    isOnline BOOLEAN DEFAULT FALSE,
    isFlagged BOOLEAN DEFAULT FALSE,
    birthday DATE,
    bio TEXT,
    warningCount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INTEREST
CREATE TABLE interest (
    interestID SERIAL PRIMARY KEY,
    interestName VARCHAR(50) UNIQUE NOT NULL
);

-- 3. USER_INTEREST 
CREATE TABLE user_interest (
    userInterestID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID) ON DELETE CASCADE,
    interestID INT REFERENCES interest(interestID) ON DELETE CASCADE
);

-- 4. LOG 
CREATE TABLE log (
    logID SERIAL PRIMARY KEY,
    accountID UUID REFERENCES account(accountID),
    actionType VARCHAR(100),
    actionTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. FEEDBACK 
CREATE TABLE feedback (
    feedbackID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID),
    feedbackMessage TEXT NOT NULL,
    feedbackCategory VARCHAR(50),
    feedbackSubmitTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedbackReviewBy VARCHAR(100)
);

-- 6. MOOD 
CREATE TABLE mood (
    moodID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID) ON DELETE CASCADE,
    currentMood VARCHAR(50),
    note TEXT,
    moodCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FRIEND 
CREATE TABLE friend (
    friendID SERIAL PRIMARY KEY,
    userID1 UUID REFERENCES account(accountID),
    userID2 UUID REFERENCES account(accountID),
    friendStatus VARCHAR(20) DEFAULT 'Pending',
    friendDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. STREAK
CREATE TABLE streak (
    streakID SERIAL PRIMARY KEY,
    friendID INT REFERENCES friend(friendID) ON DELETE CASCADE,
    streakCount INT DEFAULT 0,
    lastInteraction TIMESTAMP
);

-- 9. POST 
CREATE TABLE post (
    postID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID) ON DELETE CASCADE,
    postContent TEXT NOT NULL,
    isHidden BOOLEAN DEFAULT FALSE,
    postCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. REPLY 
CREATE TABLE reply (
    replyID SERIAL PRIMARY KEY,
    postID INT REFERENCES post(postID) ON DELETE CASCADE,
    userID UUID REFERENCES account(accountID),
    replyContent TEXT NOT NULL,
    isHidden BOOLEAN DEFAULT FALSE,
    replyCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. REACTION 
CREATE TABLE reaction (
    reactionID SERIAL PRIMARY KEY,
    postID INT REFERENCES post(postID) ON DELETE CASCADE,
    userID UUID REFERENCES account(accountID),
    reactionType VARCHAR(20),
    reactionCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. REPORTED_CONTENT 
CREATE TABLE reported_content (
    reportedContentID SERIAL PRIMARY KEY,
    postID INT REFERENCES post(postID) ON DELETE CASCADE,
    reporterID UUID REFERENCES account(accountID),
    reportReason VARCHAR(255),
    reportStatus VARCHAR(20) DEFAULT 'Pending',
    reportTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. HELPER_APPLICATION 
CREATE TABLE helper_application (
    applicationID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID),
    counsellorID UUID REFERENCES account(accountID),
    helperStatus VARCHAR(20) DEFAULT 'Pending',
    applicationSubmissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applicationApprovalDate TIMESTAMP
);

-- 14. TASK 
CREATE TABLE task (
    taskID SERIAL PRIMARY KEY,
    counsellorID UUID REFERENCES account(accountID),
    helperID UUID REFERENCES account(accountID),
    userID UUID REFERENCES account(accountID),
    instruction TEXT,
    taskStatus VARCHAR(20) DEFAULT 'Assigned',
    taskCreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. TASK_REPORT
CREATE TABLE task_report (
    taskReportID SERIAL PRIMARY KEY,
    taskID INT REFERENCES task(taskID) ON DELETE CASCADE,
    riskLevel VARCHAR(20),
    taskSummary TEXT,
    taskReportSubmitTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. CHAT 
CREATE TABLE chat (
    chatID SERIAL PRIMARY KEY,
    userID UUID REFERENCES account(accountID),
    helperID UUID REFERENCES account(accountID),
    taskID INT REFERENCES task(taskID),
    chatContent TEXT,
    chatStartTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chatEndTime TIMESTAMP,
    isAnonymous BOOLEAN DEFAULT TRUE
);