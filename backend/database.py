# -*- coding: utf-8 -*-
"""
Database layer for Firebase Firestore and Cloud Storage
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from config import BASE_DIR

CREDENTIALS_PATH = os.path.join(BASE_DIR, 'firebase_credentials.json')
firebase_app = None

def init_firebase():
    global firebase_app
    if firebase_admin._apps:
        firebase_app = firebase_admin.get_app()
        return firebase_app

    cred = None
    if os.path.exists(CREDENTIALS_PATH):
        try:
            cred = credentials.Certificate(CREDENTIALS_PATH)
        except Exception as e:
            print(f"[database] Error reading file: {e}")
    else:
        env_cred = os.environ.get('FIREBASE_CREDENTIALS')
        if env_cred:
            import base64
            try:
                if env_cred.strip().startswith('{'):
                    cred_dict = json.loads(env_cred)
                else:
                    decoded = base64.b64decode(env_cred).decode('utf-8')
                    cred_dict = json.loads(decoded)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                print(f"[database] Error reading FIREBASE_CREDENTIALS env var: {e}")
        else:
            print(f"[database] ไม่พบไฟล์ {CREDENTIALS_PATH} และไม่มี Environment Variable FIREBASE_CREDENTIALS")
            return None

    if cred:
        try:
            project_id = cred.project_id if hasattr(cred, 'project_id') else getattr(cred, 'project_id', None)
            if not project_id:
                if os.path.exists(CREDENTIALS_PATH):
                    with open(CREDENTIALS_PATH, 'r', encoding='utf-8') as f:
                        project_id = json.load(f).get('project_id')
                elif 'env_cred' in locals() and env_cred:
                    project_id = json.loads(env_cred).get('project_id')

            bucket_name = f"{project_id}.firebasestorage.app" if project_id else None
            
            firebase_app = firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name
            })
            print(f"[database] Firebase initialized (Bucket: {bucket_name})")
            return firebase_app
        except Exception as e:
            print(f"[database] Error initializing Firebase: {e}")
            return None
    return None

def get_db():
    """Returns Firestore client"""
    if not firebase_admin._apps:
        init_firebase()
    return firestore.client()

def get_bucket():
    """Returns Firebase Storage bucket"""
    if not firebase_admin._apps:
        init_firebase()
    return storage.bucket()

def init_db():
    """Called from app.py at startup"""
    init_firebase()

