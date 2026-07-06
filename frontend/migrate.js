const fs = require('fs');
const path = require('path');

const SRC = 'd:/WEB AND APP DEV/Smart_LMS_FYP/frontend/src/pages';
const DEST = 'd:/WEB AND APP DEV/Smart_LMS_FYP/frontend-next/app';

// Mapping: [source file relative to SRC, destination file relative to DEST]
const fileMappings = [
  // Student pages
  ['student/Dashboard.jsx', 'student/page.jsx'],
  ['student/MyCourses.jsx', 'student/courses/page.jsx'],
  ['student/ViewCourse.jsx', 'student/course/page.jsx'],
  ['student/Assignments.jsx', 'student/assignments/page.jsx'],
  ['student/SubmitAssignment.jsx', 'student/submit-assignment/page.jsx'],
  ['student/Grades.jsx', 'student/grades/page.jsx'],
  ['student/Quizzes.jsx', 'student/quizzes/page.jsx'],
  ['student/Profile.jsx', 'student/profile/page.jsx'],
  // Faculty pages
  ['faculty/FacultyDashboard.jsx', 'faculty/page.jsx'],
  ['faculty/MyCourses.jsx', 'faculty/courses/page.jsx'],
  ['faculty/ViewCourse.jsx', 'faculty/course/[id]/page.jsx'],
  ['faculty/UploadLectureNotes.jsx', 'faculty/course/[id]/lectures/page.jsx'],
  ['faculty/CreateAssignment.jsx', 'faculty/course/[id]/assignments/page.jsx'],
  ['faculty/CreateQuiz.jsx', 'faculty/course/[id]/quizzes/page.jsx'],
  ['faculty/Attendance.jsx', 'faculty/course/[id]/attendance/page.jsx'],
  ['faculty/ViewSubmissions.jsx', 'faculty/course/[id]/submissions/page.jsx'],
  ['faculty/FacultyProfile.jsx', 'faculty/profile/page.jsx'],
  ['faculty/FacultyAssignments.jsx', 'faculty/assignments/page.jsx'],
  ['faculty/AutoGrading.jsx', 'faculty/auto-grading/page.jsx'],
  ['faculty/Plagiarism.jsx', 'faculty/plagiarism/page.jsx'],
  ['faculty/MidTermReports.jsx', 'faculty/mid-term-reports/page.jsx'],
  ['faculty/Analytics.jsx', 'faculty/analytics/page.jsx'],
];

function transform(content, srcFile) {
  let result = content;

  // Add "use client" at the top if not present
  if (!result.includes('"use client"')) {
    result = '"use client";\n\n' + result;
  }

  // Replace react-router-dom imports
  // Remove the entire react-router-dom import line
  result = result.replace(/import\s*\{[^}]*\}\s*from\s*["']react-router-dom["'];?\s*\n/g, '');

  // Add next/navigation imports based on usage
  const needsRouter = result.includes('useNavigate') || result.includes('navigate(');
  const needsParams = result.includes('useParams');
  const needsPathname = result.includes('useLocation');
  const needsLink = result.includes('<Link ');

  let nextImports = [];
  if (needsRouter || needsParams || needsPathname) {
    let imports = [];
    if (needsRouter) imports.push('useRouter');
    if (needsParams) imports.push('useParams');
    if (needsPathname) imports.push('usePathname');
    nextImports.push(`import { ${imports.join(', ')} } from "next/navigation";`);
  }
  if (needsLink) {
    nextImports.push('import Link from "next/link";');
  }

  if (nextImports.length > 0) {
    // Insert after the "use client" line
    result = result.replace('"use client";\n\n', '"use client";\n\n' + nextImports.join('\n') + '\n');
  }

  // Replace useNavigate() with useRouter()
  result = result.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();');
  
  // Replace navigate( with router.push(
  result = result.replace(/navigate\(/g, 'router.push(');

  // Replace useParams() usage
  result = result.replace(/const\s*\{\s*(\w+)\s*\}\s*=\s*useParams\(\);?/g, (match, paramName) => {
    return `const params = useParams();\n  const ${paramName} = params.${paramName};`;
  });

  // Replace useLocation() with usePathname()
  result = result.replace(/const\s+location\s*=\s*useLocation\(\);?/g, 'const pathname = usePathname();');
  result = result.replace(/location\.pathname/g, 'pathname');

  // Replace Link component: to= -> href=
  result = result.replace(/<Link\s+to=/g, '<Link href=');
  // Also handle Link with other props before to=
  result = result.replace(/(<Link[^>]*)\bto=/g, '$1href=');

  // Replace image imports with public paths
  result = result.replace(/import\s+\w+\s+from\s*["']\.\.\/\.\.\/assets\/images\/(.+?)["'];?\s*\n/g, '');
  result = result.replace(/import\s+\w+\s+from\s*["']\.\.\/assets\/images\/(.+?)["'];?\s*\n/g, '');
  
  // Replace image variable references with public paths
  result = result.replace(/\{landingBg\}/g, '"/images/landing-bg.jpg"');
  result = result.replace(/\{campusImg\}/g, '"/images/campus.jpg"');
  result = result.replace(/\{studentImage\}/g, '"/images/student.jpg"');
  result = result.replace(/src=\{landingBg\}/g, 'src="/images/landing-bg.jpg"');
  result = result.replace(/src=\{campusImg\}/g, 'src="/images/campus.jpg"');
  result = result.replace(/src=\{studentImage\}/g, 'src="/images/student.jpg"');

  // Replace component imports from relative paths to @/ aliases
  result = result.replace(/from\s*["']\.\.\/\.\.\/components\//g, 'from "@/components/');
  result = result.replace(/from\s*["']\.\.\/components\//g, 'from "@/components/');

  // BUG FIX: Fix the wrong navigation path in CreateAssignment
  if (srcFile.includes('CreateAssignment')) {
    result = result.replace(/router\.push\("\/faculty\/my-courses"\)/g, 'router.push("/faculty/courses")');
  }

  // Replace <Navigate component usage (from ProtectedRoute)
  result = result.replace(/<Navigate\s+to=/g, '<Navigate href=');

  return result;
}

let successCount = 0;
let errorCount = 0;

for (const [srcRel, destRel] of fileMappings) {
  const srcPath = path.join(SRC, srcRel);
  const destPath = path.join(DEST, destRel);

  try {
    const content = fs.readFileSync(srcPath, 'utf-8');
    const transformed = transform(content, srcRel);

    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, transformed, 'utf-8');
    console.log(`✅ ${srcRel} -> ${destRel}`);
    successCount++;
  } catch (err) {
    console.error(`❌ ${srcRel}: ${err.message}`);
    errorCount++;
  }
}

// Create alias pages for /student/dashboard and /faculty/dashboard
const studentDashAlias = `import StudentDashboard from "../page";\nexport default StudentDashboard;\n`;
const facultyDashAlias = `import FacultyDashboard from "../page";\nexport default FacultyDashboard;\n`;

fs.mkdirSync(path.join(DEST, 'student/dashboard'), { recursive: true });
fs.writeFileSync(path.join(DEST, 'student/dashboard/page.jsx'), studentDashAlias);
console.log('✅ Created student/dashboard alias');

fs.mkdirSync(path.join(DEST, 'faculty/dashboard'), { recursive: true });
fs.writeFileSync(path.join(DEST, 'faculty/dashboard/page.jsx'), facultyDashAlias);
console.log('✅ Created faculty/dashboard alias');

console.log(`\nDone! ${successCount} files migrated, ${errorCount} errors.`);
