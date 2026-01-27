import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sip.com' },
        update: {},
        create: {
            email: 'admin@sip.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create sample employer
    const employerPasswordHash = await bcrypt.hash('Employer@123', 10);
    const employer = await prisma.user.upsert({
        where: { email: 'employer@example.com' },
        update: {},
        create: {
            email: 'employer@example.com',
            passwordHash: employerPasswordHash,
            role: 'EMPLOYER',
            status: 'ACTIVE',
            emailVerified: true,
            employerProfile: {
                create: {
                    companyName: 'Tech Innovations Inc.',
                    industry: 'Technology',
                    website: 'https://techinnovations.com',
                    description: 'Leading technology company focused on innovation',
                    trustScore: 85,
                    kycStatus: 'APPROVED',
                },
            },
        },
    });
    console.log('✅ Employer user created:', employer.email);

    // Create sample student
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);
    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            passwordHash: studentPasswordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
            studentProfile: {
                create: {
                    fullName: 'John Doe',
                    collegeName: 'MIT',
                    degree: 'Computer Science',
                    graduationYear: 2025,
                    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
                },
            },
        },
    });
    console.log('✅ Student user created:', student.email);

    // Create sample internship
    const internship = await prisma.internship.create({
        data: {
            employerId: employer.id,
            title: 'Full Stack Developer Intern',
            description: 'Build modern web applications using React and Node.js',
            type: 'REMOTE',
            status: 'PUBLISHED',
            location: 'Remote',
            duration: 3,
            stipend: 15000,
            requiredSkills: ['React', 'Node.js', 'TypeScript'],
            preferredSkills: ['Next.js', 'PostgreSQL'],
            responsibilities: [
                'Develop frontend components',
                'Build REST APIs',
                'Write tests',
            ],
            benefits: ['Flexible hours', 'Mentorship', 'Certificate'],
            applicationDeadline: new Date('2026-03-31'),
            startDate: new Date('2026-05-01'),
            maxApplicants: 10,
        },
    });
    console.log('✅ Internship created:', internship.title);

    // Create sample application
    const application = await prisma.application.create({
        data: {
            internshipId: internship.id,
            studentId: student.id,
            status: 'SUBMITTED',
            coverLetter: 'I am excited to apply for this position...',
            aiMatchScore: 0.85,
        },
    });
    console.log('✅ Application created');

    // Create sample milestone
    const milestone = await prisma.milestone.create({
        data: {
            applicationId: application.id,
            title: 'Complete project setup',
            description: 'Setup development environment and project structure',
            amount: 5000,
            dueDate: new Date('2026-05-15'),
            status: 'NOT_STARTED',
        },
    });
    console.log('✅ Milestone created');

    console.log('🎉 Database seed completed!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@sip.com / Admin@123');
    console.log('Employer: employer@example.com / Employer@123');
    console.log('Student: student@example.com / Student@123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
