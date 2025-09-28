#!/usr/bin/env python3
"""
Migration script to convert Node.js data to Flask
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from app import app, db
from models.user import User
from models.license import License

def migrate_from_sqlite():
    """Migrate data from existing SQLite database if it exists"""
    try:
        # Check if old database exists
        old_db_path = 'license_manager_old.db'
        if not os.path.exists(old_db_path):
            print("No old database found, skipping migration")
            return
        
        print("🔄 Migrating data from old database...")
        
        # Connect to old database
        old_conn = sqlite3.connect(old_db_path)
        old_cursor = old_conn.cursor()
        
        # Migrate users
        try:
            old_cursor.execute("SELECT * FROM users")
            users = old_cursor.fetchall()
            
            for user_data in users:
                # Assuming old schema: id, email, password, role, isActive, lastLogin, createdAt, updatedAt
                user = User(
                    email=user_data[1],  # email
                    password=user_data[2],  # password (will be hashed)
                    role=user_data[3] or 'user'  # role
                )
                user.id = user_data[0]  # Keep original ID
                user.is_active = bool(user_data[4]) if user_data[4] is not None else True
                if user_data[5]:  # lastLogin
                    user.last_login = datetime.fromisoformat(user_data[5])
                if user_data[6]:  # createdAt
                    user.created_at = datetime.fromisoformat(user_data[6])
                if user_data[7]:  # updatedAt
                    user.updated_at = datetime.fromisoformat(user_data[7])
                
                db.session.add(user)
            
            print(f"✅ Migrated {len(users)} users")
        except Exception as e:
            print(f"⚠️  Error migrating users: {e}")
        
        # Migrate licenses
        try:
            old_cursor.execute("SELECT * FROM licenses")
            licenses = old_cursor.fetchall()
            
            for license_data in licenses:
                # Create new license with migrated data
                license = License(
                    license_key=license_data[1],  # licenseKey
                    client_id=license_data[2],  # clientId
                    client_name=license_data[3],  # clientName
                    client_email=license_data[4],  # clientEmail
                    product_name=license_data[5] or 'Torro Platform',  # productName
                    version=license_data[6] or '1.0.0',  # version
                    license_type=license_data[7] or 'trial',  # licenseType
                    status=license_data[8] or 'active',  # status
                    expiry_date=datetime.fromisoformat(license_data[10]) if license_data[10] else datetime.utcnow(),  # expiryDate
                    max_users=license_data[11] or 1,  # maxUsers
                    max_connections=license_data[12] or 10,  # maxConnections
                    created_by=license_data[18]  # createdBy
                )
                
                license.id = license_data[0]  # Keep original ID
                
                # Handle features
                if license_data[13]:  # features
                    try:
                        features = json.loads(license_data[13])
                        license.set_features(features)
                    except:
                        license.set_features({})
                
                # Handle dates
                if license_data[9]:  # issuedDate
                    license.issued_date = datetime.fromisoformat(license_data[9])
                if license_data[14]:  # lastChecked
                    license.last_checked = datetime.fromisoformat(license_data[14])
                if license_data[15]:  # checkCount
                    license.check_count = license_data[15]
                if license_data[16]:  # lastAccessIP
                    license.last_access_ip = license_data[16]
                if license_data[17]:  # lastAccessUserAgent
                    license.last_access_user_agent = license_data[17]
                if license_data[19]:  # notes
                    license.notes = license_data[19]
                if license_data[20]:  # createdAt
                    license.created_at = datetime.fromisoformat(license_data[20])
                if license_data[21]:  # updatedAt
                    license.updated_at = datetime.fromisoformat(license_data[21])
                
                # Military-grade fields
                if len(license_data) > 22:
                    license.military_grade = bool(license_data[22]) if license_data[22] is not None else True
                if len(license_data) > 23:
                    license.hardware_binding = bool(license_data[23]) if license_data[23] is not None else True
                if len(license_data) > 24:
                    license.hardware_fingerprint = license_data[24]
                if len(license_data) > 25:
                    license.security_level = license_data[25] or 'military'
                
                db.session.add(license)
            
            print(f"✅ Migrated {len(licenses)} licenses")
        except Exception as e:
            print(f"⚠️  Error migrating licenses: {e}")
        
        # Commit all changes
        db.session.commit()
        old_conn.close()
        
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.session.rollback()

def create_sample_data():
    """Create sample data for testing"""
    try:
        print("🔄 Creating sample data...")
        
        # Create admin user
        admin_user = User(
            email='admin@torro.com',
            password='admin123',
            role='admin'
        )
        db.session.add(admin_user)
        db.session.flush()  # Get the ID
        
        # Create sample license
        sample_license = License(
            license_key='TORRO-MIL-1234567890-ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890-12345678',
            client_id='TORRO-1234567890-ABCD-EFGHIJKLM-12345678',
            client_name='Sample Client',
            client_email='client@example.com',
            product_name='Torro Platform',
            version='1.0.0',
            license_type='premium',
            status='active',
            expiry_date=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
            max_users=10,
            max_connections=100,
            created_by=admin_user.id,
            military_grade=True,
            hardware_binding=True,
            security_level='military'
        )
        
        # Set features
        sample_license.set_features({
            'database_access': True,
            'api_access': True,
            'analytics': True,
            'support': True
        })
        
        db.session.add(sample_license)
        db.session.commit()
        
        print("✅ Sample data created successfully!")
        print(f"   Admin user: admin@torro.com / admin123")
        print(f"   Sample license: {sample_license.client_id}")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.session.rollback()

def main():
    """Main migration function"""
    print("🚀 Torro License Manager - Flask Migration")
    print("=" * 50)
    
    with app.app_context():
        # Create tables
        db.create_all()
        print("✅ Database tables created")
        
        # Check if we have any existing data
        user_count = User.query.count()
        license_count = License.query.count()
        
        if user_count == 0 and license_count == 0:
            print("📊 No existing data found")
            
            # Try to migrate from old database
            migrate_from_sqlite()
            
            # If still no data, create sample data
            if User.query.count() == 0:
                create_sample_data()
        else:
            print(f"📊 Found existing data: {user_count} users, {license_count} licenses")
        
        print("=" * 50)
        print("✅ Migration completed!")
        print("🚀 You can now start the Flask application with: python run_flask.py")

if __name__ == '__main__':
    main()
