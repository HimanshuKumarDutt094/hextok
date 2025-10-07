package com.hextok.localstorage

import android.content.Context
import android.content.SharedPreferences
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.tasm.behavior.LynxContext

/**
 * Local Storage Module for Lynx
 * Provides persistent storage capabilities using Android SharedPreferences
 * 
 * This module allows storing key-value pairs that persist across app sessions.
 * Primarily used for storing authentication tokens and user preferences.
 */
class LocalStorageModule(context: Context) : LynxModule(context) {
    
    companion object {
        private const val PREF_NAME = "HextokLocalStorage"
    }

    private fun getContext(): Context {
        return when (mContext) {
            is LynxContext -> (mContext as LynxContext).context
            is Context -> mContext as Context
            else -> throw IllegalStateException("Unable to get Android Context from Lynx context")
        }
    }

    private fun getSharedPreferences(): SharedPreferences {
        return getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Store a key-value pair in local storage
     * @param key The key to store the value under
     * @param value The string value to store
     */
    @LynxMethod
    fun setStorageItem(key: String, value: String) {
        try {
            val sharedPreferences = getSharedPreferences()
            val editor = sharedPreferences.edit()
            editor.putString(key, value)
            editor.apply()
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to set storage item: $key", e)
        }
    }

    /**
     * Retrieve a value from local storage
     * @param key The key to retrieve the value for
     * @param callback Callback function that receives the value (null if not found)
     */
    @LynxMethod
    fun getStorageItem(key: String, callback: Callback) {
        try {
            val sharedPreferences = getSharedPreferences()
            val value = sharedPreferences.getString(key, null)
            callback.invoke(value)
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to get storage item: $key", e)
            callback.invoke(null)
        }
    }

    /**
     * Remove a specific key from local storage
     * @param key The key to remove
     */
    @LynxMethod
    fun removeStorageItem(key: String) {
        try {
            val sharedPreferences = getSharedPreferences()
            val editor = sharedPreferences.edit()
            editor.remove(key)
            editor.apply()
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to remove storage item: $key", e)
        }
    }

    /**
     * Clear all data from local storage
     */
    @LynxMethod
    fun clearStorage() {
        try {
            val sharedPreferences = getSharedPreferences()
            val editor = sharedPreferences.edit()
            editor.clear()
            editor.apply()
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to clear storage", e)
        }
    }

    /**
     * Get all keys stored in local storage
     * @param callback Callback function that receives an array of all keys
     */
    @LynxMethod
    fun getAllKeys(callback: Callback) {
        try {
            val sharedPreferences = getSharedPreferences()
            val keys = sharedPreferences.all.keys.toList()
            callback.invoke(keys.toTypedArray())
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to get all keys", e)
            callback.invoke(emptyArray<String>())
        }
    }

    /**
     * Check if a key exists in local storage
     * @param key The key to check
     * @param callback Callback function that receives a boolean indicating if the key exists
     */
    @LynxMethod
    fun hasStorageItem(key: String, callback: Callback) {
        try {
            val sharedPreferences = getSharedPreferences()
            val exists = sharedPreferences.contains(key)
            callback.invoke(exists)
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to check if storage item exists: $key", e)
            callback.invoke(false)
        }
    }

    /**
     * Get the size of stored data (number of key-value pairs)
     * @param callback Callback function that receives the count
     */
    @LynxMethod
    fun getStorageSize(callback: Callback) {
        try {
            val sharedPreferences = getSharedPreferences()
            val size = sharedPreferences.all.size
            callback.invoke(size)
        } catch (e: Exception) {
            android.util.Log.e("LocalStorageModule", "Failed to get storage size", e)
            callback.invoke(0)
        }
    }
}