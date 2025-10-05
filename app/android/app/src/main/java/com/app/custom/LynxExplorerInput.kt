package com.app.custom

import android.content.Context
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.view.View
import androidx.appcompat.widget.AppCompatEditText
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

class LynxExplorerInput(context: LynxContext) : LynxUI<AppCompatEditText>(context) {

  private var isUpdating = false

  override fun createView(context: Context): AppCompatEditText {
    return AppCompatEditText(context).apply {
      setSingleLine(true)

      addTextChangedListener(object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        override fun afterTextChanged(s: Editable?) {
          if (!isUpdating) {
            emitEvent("input", mapOf(
              "value" to (s?.toString() ?: ""),
              "cursor" to selectionStart
            ))
          }
        }
      })

      setOnFocusChangeListener { _, hasFocus ->
        if (hasFocus) {
          emitEvent("focus", mapOf("value" to text.toString()))
        } else {
          emitEvent("blur", mapOf("value" to text.toString()))
          emitEvent("change", mapOf("value" to text.toString()))
        }
      }
    }
  }

  @LynxProp(name = "value")
  fun setValue(value: String) {
    if (value != mView.text.toString()) {
      isUpdating = true
      mView.setText(value)
      mView.setSelection(value.length)
      isUpdating = false
    }
  }

  @LynxProp(name = "placeholder")
  fun setPlaceholder(placeholder: String) {
    mView.hint = placeholder
  }

  @LynxProp(name = "maxLength")
  fun setMaxLength(maxLength: Int) {
    mView.filters = arrayOf(InputFilter.LengthFilter(maxLength))
  }

  @LynxProp(name = "type")
  fun setType(type: String) {
    val inputType = when (type) {
      "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
      "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
      "number" -> InputType.TYPE_CLASS_NUMBER
      else -> InputType.TYPE_CLASS_TEXT
    }
    mView.inputType = inputType
  }

  @LynxProp(name = "disabled")
  fun setDisabled(disabled: Boolean) {
    mView.isEnabled = !disabled
    mView.alpha = if (disabled) 0.5f else 1.0f
  }

  @LynxUIMethod
  fun focus(params: ReadableMap, callback: Callback) {
    if (mView.requestFocus()) {
      callback.invoke(LynxUIMethodConstants.SUCCESS)
    } else {
      callback.invoke(LynxUIMethodConstants.UNKNOWN, "Failed to focus")
    }
  }

  @LynxUIMethod
  fun blur(params: ReadableMap, callback: Callback) {
    mView.clearFocus()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun getValue(params: ReadableMap, callback: Callback) {
    callback.invoke(LynxUIMethodConstants.SUCCESS, mView.text.toString())
  }

  private fun emitEvent(name: String, detail: Map<String, Any>) {
    try {
      val event = LynxCustomEvent(sign, name)
      detail.forEach { (k, v) -> event.addDetail(k, v) }
      lynxContext.eventEmitter.sendCustomEvent(event)
    } catch (_: Exception) { /* best-effort */ }
  }
}
