<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends StoreCategoryRequest
{
    private ?Category $category = null;

    public function category(): Category
    {
        return $this->category ??= $this->user()->categories()->findOrFail($this->route('id'));
    }

    protected function uniqueName(): Unique
    {
        return parent::uniqueName()->ignore($this->category()->id);
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $category = $this->category();
                $type = $this->input('type');

                if ($type && $type !== $category->type->value && $category->transactions()->exists()) {
                    $validator->errors()->add('type', 'Jenis kategori tidak bisa diubah karena sudah dipakai transaksi.');
                }
            },
        ];
    }
}
