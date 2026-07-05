import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch, query, limit } from 'firebase/firestore';
import { Project, ProjectProgressReport, NotificationAlert, SchedulerSettings, CompiledWeeklySummary } from '../types';
import { INITIAL_PROJECTS, INITIAL_REPORTS, INITIAL_NOTIFICATIONS, INITIAL_SCHEDULER_SETTINGS, INITIAL_COMPILED_SUMMARIES } from '../data';

export const saveProjectToFirestore = async (project: Project) => {
  try {
    const docRef = doc(db, 'projects', project.id);
    await setDoc(docRef, project);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
};

export const deleteProjectFromFirestore = async (projectId: string) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
};

export const saveReportToFirestore = async (report: ProjectProgressReport) => {
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(docRef, report);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${report.id}`);
  }
};

export const deleteReportFromFirestore = async (reportId: string) => {
  try {
    const docRef = doc(db, 'reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}`);
  }
};

export const saveNotificationToFirestore = async (notif: NotificationAlert) => {
  try {
    const docRef = doc(db, 'notifications', notif.id);
    await setDoc(docRef, notif);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notif.id}`);
  }
};

export const saveSchedulerSettingsToFirestore = async (settings: SchedulerSettings) => {
  try {
    const docRef = doc(db, 'schedulerSettings', 'global');
    await setDoc(docRef, settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'schedulerSettings/global');
  }
};

export const saveCompiledSummaryToFirestore = async (summary: CompiledWeeklySummary) => {
  try {
    const docRef = doc(db, 'compiledSummaries', summary.id);
    await setDoc(docRef, summary);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `compiledSummaries/${summary.id}`);
  }
};

export const deleteSummaryFromFirestore = async (summaryId: string) => {
  try {
    const docRef = doc(db, 'compiledSummaries', summaryId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `compiledSummaries/${summaryId}`);
  }
};

export const seedFirestoreIfEmpty = async () => {
  try {
    const q = query(collection(db, 'projects'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('Firestore projects collection is empty, seeding with default data...');
      const batch = writeBatch(db);

      // Seed projects
      INITIAL_PROJECTS.forEach((proj) => {
        const docRef = doc(db, 'projects', proj.id);
        batch.set(docRef, proj);
      });

      // Seed reports
      INITIAL_REPORTS.forEach((rep) => {
        const docRef = doc(db, 'reports', rep.id);
        batch.set(docRef, rep);
      });

      // Seed notifications
      INITIAL_NOTIFICATIONS.forEach((notif) => {
        const docRef = doc(db, 'notifications', notif.id);
        batch.set(docRef, notif);
      });

      // Seed scheduler settings
      const schedulerRef = doc(db, 'schedulerSettings', 'global');
      batch.set(schedulerRef, INITIAL_SCHEDULER_SETTINGS);

      // Seed compiled summaries
      INITIAL_COMPILED_SUMMARIES.forEach((summary) => {
        const docRef = doc(db, 'compiledSummaries', summary.id);
        batch.set(docRef, summary);
      });

      await batch.commit();
      console.log('Firestore successfully seeded with default data!');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seeding');
  }
};

export const clearFirestoreData = async () => {
  try {
    const batch = writeBatch(db);
    
    // Clear projects
    const projSnap = await getDocs(collection(db, 'projects'));
    projSnap.forEach((doc) => batch.delete(doc.ref));

    // Clear reports
    const repSnap = await getDocs(collection(db, 'reports'));
    repSnap.forEach((doc) => batch.delete(doc.ref));

    // Clear notifications
    const notifSnap = await getDocs(collection(db, 'notifications'));
    notifSnap.forEach((doc) => batch.delete(doc.ref));

    // Clear scheduler
    const schedSnap = await getDocs(collection(db, 'schedulerSettings'));
    schedSnap.forEach((doc) => batch.delete(doc.ref));

    // Clear summaries
    const sumSnap = await getDocs(collection(db, 'compiledSummaries'));
    sumSnap.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'clear_all');
  }
};
