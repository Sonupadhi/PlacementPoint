import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BackendServer.settings')
django.setup()

from authentications.models import User, Student, Coordinator
from jobs.models import JobOpening, JobRound
from applications.models import Application
from communications.models import Notification, FAQ, StudentQuery
from datetime import datetime, timedelta
from django.utils import timezone

def seed():
    print("Seeding Placement Point database...")

    # 1. Super Admin Account
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@placementpoint.edu',
            'role': 'SUPER_ADMIN',
            'is_first_login': False
        }
    )
    admin_user.set_password('Admin@123')
    admin_user.role = 'SUPER_ADMIN'
    admin_user.is_first_login = False
    admin_user.save()
    print("Updated Super Admin: admin / Admin@123")

    # 2. Placement Coordinator Accounts
    coord1_user, created = User.objects.get_or_create(
        username='coord1',
        defaults={
            'email': 'coord.swain@placementpoint.edu',
            'role': 'COORDINATOR',
            'is_first_login': False
        }
    )
    coord1_user.set_password('Coord@123')
    coord1_user.role = 'COORDINATOR'
    coord1_user.save()

    coord1_profile, _ = Coordinator.objects.get_or_create(
        coordinator=coord1_user,
        defaults={
            'employee_id': 'EMP101',
            'name': 'Satyajit Swain (Coordinator)',
            'department': 'Training & Placement Cell'
        }
    )

    coord2_user, created = User.objects.get_or_create(
        username='coord2',
        defaults={
            'email': 'coord.mohanty@placementpoint.edu',
            'role': 'COORDINATOR',
            'is_first_login': True
        }
    )
    coord2_user.set_password('Coord@123')
    coord2_user.role = 'COORDINATOR'
    coord2_user.save()

    Coordinator.objects.get_or_create(
        coordinator=coord2_user,
        defaults={
            'employee_id': 'EMP102',
            'name': 'Amisha Mohanty',
            'department': 'Computer Science Department'
        }
    )
    print("Updated Coordinators: coord1 / Coord@123, coord2 / Coord@123")

    # 3. Student Accounts
    students_data = [
        {
            'username': '25C216A01',
            'reg_id': '25C216A01',
            'name': 'Biswaranjan Padhi',
            'email': 'biswaranjan@student.edu',
            'branch': 'MCA',
            'cgpa': 8.85,
            'passout_year': 2027,
            'backlogs': 0,
            'gap': 0
        },
        {
            'username': '25C219A58',
            'reg_id': '25C219A58',
            'name': 'Satyajit Swain',
            'email': 'satyajit@student.edu',
            'branch': 'MCA',
            'cgpa': 9.10,
            'passout_year': 2027,
            'backlogs': 0,
            'gap': 0
        },
        {
            'username': '25C213A23',
            'reg_id': '25C213A23',
            'name': 'Amisha Mohanty',
            'email': 'amisha@student.edu',
            'branch': 'CSE',
            'cgpa': 8.60,
            'passout_year': 2027,
            'backlogs': 0,
            'gap': 6
        },
        {
            'username': '25C200B05',
            'reg_id': '25C200B05',
            'name': 'Rahul Sharma',
            'email': 'rahul@student.edu',
            'branch': 'ECE',
            'cgpa': 7.20,
            'passout_year': 2027,
            'backlogs': 2,
            'gap': 12
        },
        {
            'username': 'student1',
            'reg_id': '25C100001',
            'name': 'Demo Student',
            'email': 'student1@placementpoint.edu',
            'branch': 'MCA',
            'cgpa': 8.50,
            'passout_year': 2027,
            'backlogs': 0,
            'gap': 0
        }
    ]

    student_profiles = []
    for sd in students_data:
        st_user, created = User.objects.get_or_create(
            username=sd['username'],
            defaults={
                'email': sd['email'],
                'role': 'STUDENT',
                'is_first_login': (sd['username'] == 'student1')
            }
        )
        if sd['username'] == '25C219A58':
            st_user.set_password('Satya@123')
        else:
            st_user.set_password('Student@123')
        st_user.role = 'STUDENT'
        st_user.save()

        st_profile, _ = Student.objects.get_or_create(
            student=st_user,
            defaults={
                'registration_id': sd['reg_id'],
                'name': sd['name'],
                'branch': sd['branch'],
                'cgpa': sd['cgpa'],
                'passout_year': sd['passout_year'],
                'active_backlogs': sd['backlogs'],
                'career_gap_months': sd['gap']
            }
        )
        student_profiles.append(st_profile)

    print("Updated Student accounts (Default pass: Student@123)")

    # 4. Job Openings with Dynamic Hiring Rounds
    job1, created = JobOpening.objects.get_or_create(
        company_name='Cognizant',
        role_title='GenC & GenC Elevate Developer',
        defaults={
            'created_by': coord1_profile,
            'description': 'Cognizant is hiring software engineers for the 2027 batch. Roles include full-stack development, cloud engineering, and AI/ML solutions.',
            'apply_link': 'https://careers.cognizant.com/campus-2027',
            'min_cgpa': 7.00,
            'max_backlogs': 1,
            'max_career_gap_months': 24,
            'allowed_branches': 'CSE, IT, MCA, ECE',
            'passout_year': 2027,
            'deadline': timezone.now() + timedelta(days=15)
        }
    )
    if created:
        rounds = ['Applied', 'Aptitude Test', 'Technical Interview', 'HR Interview', 'Managerial Round']
        for idx, r_name in enumerate(rounds):
            JobRound.objects.create(job=job1, round_order=idx+1, round_name=r_name)

    job2, created = JobOpening.objects.get_or_create(
        company_name='TCS',
        role_title='TCS Digital / Prime Engineer',
        defaults={
            'created_by': coord1_profile,
            'description': 'TCS Digital hiring drive for high-performing software graduates. Specialized roles in Cloud Infrastructure, DevOps, and Data Science.',
            'apply_link': 'https://nextstep.tcs.com',
            'min_cgpa': 8.00,
            'max_backlogs': 0,
            'max_career_gap_months': 12,
            'allowed_branches': 'CSE, IT, MCA',
            'passout_year': 2027,
            'deadline': timezone.now() + timedelta(days=20)
        }
    )
    if created:
        rounds = ['Applied', 'Online Coding Assessment', 'Technical Interview I', 'Technical Interview II', 'HR Round']
        for idx, r_name in enumerate(rounds):
            JobRound.objects.create(job=job2, round_order=idx+1, round_name=r_name)

    job3, created = JobOpening.objects.get_or_create(
        company_name='Infosys',
        role_title='Specialist Programmer (SP) / DSE',
        defaults={
            'created_by': coord1_profile,
            'description': 'Infosys HackWithInfy campus hiring for Specialist Programmer roles with competitive compensation packages.',
            'apply_link': 'https://infosys.com/careers',
            'min_cgpa': 7.50,
            'max_backlogs': 0,
            'max_career_gap_months': 18,
            'allowed_branches': 'ALL',
            'passout_year': 2027,
            'deadline': timezone.now() + timedelta(days=30)
        }
    )
    if created:
        rounds = ['Applied', 'HackWithInfy Coding Round', 'Technical & System Design', 'HR Assessment']
        for idx, r_name in enumerate(rounds):
            JobRound.objects.create(job=job3, round_order=idx+1, round_name=r_name)

    print("Created Sample Job Openings: Cognizant, TCS Digital, Infosys SP")

    # 5. Applications & Round Progressions
    r1_cognizant = JobRound.objects.filter(job=job1, round_order=3).first() # Technical Interview
    r2_tcs = JobRound.objects.filter(job=job2, round_order=2).first() # Online Coding Assessment

    if student_profiles:
        # Biswaranjan applied to Cognizant (at Technical Interview)
        Application.objects.get_or_create(
            student=student_profiles[0],
            job=job1,
            defaults={'current_round': r1_cognizant, 'status': 'IN_PROGRESS'}
        )
        # Satyajit applied to TCS (at Online Coding Assessment)
        Application.objects.get_or_create(
            student=student_profiles[1],
            job=job2,
            defaults={'current_round': r2_tcs, 'status': 'IN_PROGRESS'}
        )
        # Biswaranjan applied to TCS
        Application.objects.get_or_create(
            student=student_profiles[0],
            job=job2,
            defaults={'current_round': r2_tcs, 'status': 'IN_PROGRESS'}
        )

    # 6. Notifications & FAQs
    Notification.objects.get_or_create(
        title='Cognizant GenC Drive Shortlist Released!',
        defaults={
            'created_by': coord1_profile,
            'message': 'The shortlist for Cognizant GenC Technical Interview round is now available. Check your application progress bar on your student dashboard.',
            'target_branch': 'ALL',
            'target_job': job1
        }
    )

    Notification.objects.get_or_create(
        title='Mandatory Resume Verification for 2027 Batch',
        defaults={
            'created_by': coord1_profile,
            'message': 'All final year MCA & B.Tech students are instructed to verify their active backlogs and CGPA records with the Placement Cell.',
            'target_branch': 'ALL'
        }
    )

    faqs = [
        ('How is my eligibility calculated for job drives?', 'Eligibility is automatically calculated by checking your CGPA >= Min CGPA, Active Backlogs <= Allowed Backlogs, Career Gap <= Max Gap Months, and your registered Branch matching allowed branches.', 'Eligibility'),
        ('What happens if I get shortlisted via Excel upload?', 'Your status automatically advances to the next recruitment round on your dynamic progress bar indicator.', 'Selection Process'),
        ('Why do I have to change my password on first login?', 'For security purposes, initial accounts generated by default credentials must update their password before accessing portal features.', 'Security')
    ]
    for q, a, cat in faqs:
        FAQ.objects.get_or_create(question=q, defaults={'answer': a, 'category': cat})

    print("Data seeding completed successfully!")

if __name__ == '__main__':
    seed()
