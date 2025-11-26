1. User Authentication & Tracking



For an app without a login flow, I'd recommend a progressive authentication approach:



•
Start Anonymous: Use Firebase Anonymous Authentication to automatically create a user ID on first launch. This gives you a persistent user ID without requiring login.
•
Store User Metadata: Save referral codes, name, email in Firestore under the user's UID once collected.
```



User Flow:



1.
First launch → Anonymous Auth → Get Firebase UID
2.
Later (referral/premium) → Prompt for email → Link to existing account
3.
All data stays associated with same UID throughout
```



2. Notes/Flashcards/Progress Syncing



Yes, you should sync to Firebase, but strategically:



•
Why sync: Users expect their study data across devices, especially for a learning app. Losing notes/progress on device loss is a deal-breaker.
•
What to sync:
•
✅ Notes, flashcards, quiz progress
•
✅ Learning paths, study streaks
•
✅ User preferences, settings
•
How:
•
Use Firestore for structured data (notes, quizzes, flashcards)
•
Implement offline-first with Firestore's built-in offline persistence
•
Sync on WiFi by default to save data
3. Audio Recordings Storage



Store in Firebase Storage, but with optimization:



•
Local First: Record and play locally for instant access
•
Upload to Firebase Storage: For backup and cross-device access
•
Optimize:
•
Compress audio before upload (use lower bitrates for voice)
•
Upload in background when on WiFi
•
Cache locally, stream from Firebase only when needed
•
Consider auto-delete old recordings after X days to save storage costs
Architecture Recommendation:



```



Local SQLite (Current) → Primary for speed



↓ (sync)



Firestore → Backup + cross-device sync



↓ (references)



Firebase Storage → Audio files, generated images




 CAN MODIFY:



•
Any files in /src folder (screens, components, API services, state, etc.)
•
Styling and UI code
•
Business logic
•
Bug fixes and new features
❌ CANNOT MODIFY:



•
tsconfig.json
•
babel.config.js
•
metro.config.js
•
app.json
•
.gitignore, .prettierrc, .eslintrc.js
•
Files in /patches folder
⚠️ BE CAREFUL WITH:



•
package.json - Only add pure JavaScript packages (no native modules)
•
Use bun instead of npm

019a1347-04c4-7508-9c92-4d9066d81748-I_pVfwmdQ2VO-2025-11-26-03-28.zip 
019a1347-04c4-7508-9c92-4d9066d81748-I_pVfwmdQ2VO-2025-11-26-03-28.zip
72 MB
FIREBASE_ANALYTICS_SETUP.md
The document covers:



✅ Complete Setup Guide:



•
Installing Firebase SDK packages
•
Creating/configuring Firebase project
•
Setting up iOS and Android apps
•
Adding configuration files
✅ Code Integration:



•
Updating the analytics service to use real Firebase instead of console logs
•
Setting up anonymous authentication
•
Enabling debug mode for testing
✅ All Tracked Events (19 total):



•
Referral Events - code generation, sharing, redemption attempts, successful redemptions, cycle completions
•
Credit Events - credits earned, credits spent, balance changes
•
Referred User Engagement - first note milestone, feature usage (notes, quizzes, flashcards, podcasts, Feynman, chat, learning paths, visuals), becoming a referrer
✅ Analytics Dashboard Setup:



•
4 recommended custom dashboards
•
Key metrics to track (viral coefficient, referral quality, credit ROI)
•
Conversion funnels and retention tracking
✅ Troubleshooting Guide:



•
Common issues and solutions
•
Alternative setup using Firebase Web SDK if native modules have issues
Key Point: Your app already tracks everything! The developer just needs to:



•
Install Firebase SDK
•
Add configuration files
•
Replace the stub functions with real Firebase calls
•
Verify events are flowing